from fastapi import FastAPI, HTTPException, Depends, WebSocket, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Tuple
import json
from collections import deque
import random
import os
import logging
from dotenv import load_dotenv
from datetime import datetime
import time
import re
from fastapi import WebSocketDisconnect
import asyncio
import numpy as np
from pathlib import Path
from PIL import Image
import io
from sklearn.neighbors import KNeighborsRegressor
from sklearn.preprocessing import StandardScaler
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
import base64
from sklearn.metrics import mean_squared_error, r2_score

# 환경 변수 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase 초기화
try:
    cred_path = Path("firebase-credentials.json")
    if cred_path.exists():
        cred = credentials.Certificate(str(cred_path))
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("Firebase가 성공적으로 초기화되었습니다.")
    else:
        logger.warning("Firebase 인증 파일이 없습니다. Firebase 기능이 비활성화됩니다.")
        db = None
except Exception as e:
    logger.warning(f"Firebase 초기화 실패: {e}")
    db = None

class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = None
    context: Optional[List[str]] = None
    token: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    confidence: float
    context: List[str]
    timestamp: str

class pHMeasurement(BaseModel):
    ph_value: float
    red: int
    green: int
    blue: int
    timestamp: datetime = None

# pH 측정을 위한 모델과 스케일러
ph_model = None
ph_scaler = None
ph_data = []

# 대화 기록 저장
conversations = {}

# 사용자 컨텍스트 저장
user_contexts = {}

# 대화 기록 저장 함수
async def save_conversation(user_id: str, message: str, response: str, confidence: float):
    if user_id not in conversations:
        conversations[user_id] = []
    
    conversations[user_id].append({
        "message": message,
        "response": response,
        "confidence": confidence,
        "timestamp": datetime.now().isoformat()
    })

# 사용자 컨텍스트 가져오기
async def get_user_context(user_id: str) -> List[str]:
    return user_contexts.get(user_id, [])

# 사용자 컨텍스트 업데이트
async def update_user_context(user_id: str, context: List[str]):
    user_contexts[user_id] = context

# 문자열 유사도 계산
def calculate_similarity(str1: str, str2: str) -> float:
    set1 = set(str1.lower().split())
    set2 = set(str2.lower().split())
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0

# 최적의 매칭 찾기
def find_best_match(user_input: str) -> Tuple[str, float]:
    responses = {
        "안녕하세요": "안녕하세요! 어떻게 도와드릴까요?",
        "반가워요": "반갑습니다! 오늘은 어떤 도움이 필요하신가요?",
        "도움말": "저는 다음과 같은 도움을 드릴 수 있습니다:\n1. 일반적인 질문에 답변\n2. 간단한 대화\n3. 기본적인 정보 제공",
        "고마워": "천만에요! 또 필요한 것이 있으시면 말씀해주세요.",
        "잘가": "안녕히 가세요! 좋은 하루 되세요."
    }
    
    best_match = None
    best_score = 0
    
    for key in responses:
        score = calculate_similarity(user_input, key)
        if score > best_score:
            best_score = score
            best_match = key
    
    return responses.get(best_match, "죄송합니다. 이해하지 못했습니다. 다시 말씀해주세요."), best_score

# 응답 생성
def generate_response(user_input: str) -> str:
    response, confidence = find_best_match(user_input)
    return response

# 스트리밍 응답 생성
async def generate_streaming_response(user_input: str, websocket: WebSocket):
    response = generate_response(user_input)
    for char in response:
        await websocket.send_text(char)
        await asyncio.sleep(0.05)

# WebSocket 엔드포인트
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            user_input = message_data.get("message", "")
            user_id = message_data.get("user_id", "anonymous")
            
            # 컨텍스트 가져오기
            context = await get_user_context(user_id)
            
            # 응답 생성 및 전송
            await generate_streaming_response(user_input, websocket)
            
            # 대화 기록 저장
            response = generate_response(user_input)
            await save_conversation(user_id, user_input, response, 1.0)
            
    except WebSocketDisconnect:
        logger.info("WebSocket 연결이 종료되었습니다.")
    except Exception as e:
        logger.error(f"WebSocket 오류: {e}")
        await websocket.close()

# HTTP 엔드포인트
@app.post("/chat")
async def chat(message: ChatMessage):
    user_input = message.message
    user_id = message.user_id or "anonymous"
    
    # 컨텍스트 가져오기
    context = await get_user_context(user_id)
    
    # 응답 생성
    response, confidence = find_best_match(user_input)
    
    # 대화 기록 저장
    await save_conversation(user_id, user_input, response, confidence)
    
    return ChatResponse(
        response=response,
        confidence=confidence,
        context=context,
        timestamp=datetime.now().isoformat()
    )

# pH 측정 관련 엔드포인트
@app.post("/api/ph/upload")
async def upload_ph_image(ph_value: float, file: UploadFile = File(...)):
    try:
        # 이미지 읽기
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # RGB 값 추출
        image_np = np.array(image)
        average_color_per_row = np.average(image_np, axis=0)
        average_color = np.average(average_color_per_row, axis=0)
        average_color = average_color.astype(int)
        red, green, blue = average_color[0], average_color[1], average_color[2]
        
        # 데이터 저장
        measurement = pHMeasurement(
            ph_value=ph_value,
            red=red,
            green=green,
            blue=blue,
            timestamp=datetime.now()
        )
        
        ph_data.append(measurement)
        
        # Firebase에 저장
        if db:
            db.collection('ph_measurements').add({
                'ph_value': ph_value,
                'red': red,
                'green': green,
                'blue': blue,
                'timestamp': firestore.SERVER_TIMESTAMP
            })
        
        return {"message": "데이터가 성공적으로 저장되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ph/train")
async def train_ph_model():
    global ph_model, ph_scaler
    
    if len(ph_data) < 5:
        raise HTTPException(status_code=400, detail="최소 5개의 샘플이 필요합니다.")
    
    try:
        # 데이터 준비
        X = np.array([[m.red, m.green, m.blue] for m in ph_data])
        y = np.array([m.ph_value for m in ph_data])
        
        # 데이터 정규화
        ph_scaler = StandardScaler()
        X_scaled = ph_scaler.fit_transform(X)
        
        # 모델 훈련
        ph_model = KNeighborsRegressor(n_neighbors=min(5, len(ph_data)))
        ph_model.fit(X_scaled, y)
        
        return {"message": "모델이 성공적으로 훈련되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ph/predict")
async def predict_ph(image: str, rgb: dict):
    try:
        # 이미지 디코딩
        image_data = base64.b64decode(image)
        image = Image.open(io.BytesIO(image_data))
        
        # 객체 인식된 RGB 값 사용
        red = rgb['red']
        green = rgb['green']
        blue = rgb['blue']
        
        # KNN 모델로 pH 예측
        if ph_model is None or ph_scaler is None:
            raise HTTPException(status_code=400, detail="모델이 학습되지 않았습니다.")
            
        # RGB 값을 스케일링
        rgb_scaled = ph_scaler.transform([[red, green, blue]])
        
        # pH 예측
        ph_predicted = ph_model.predict(rgb_scaled)[0]
        
        # 신뢰도 계산
        confidence = 0.9
        
        return {
            "ph_value": float(ph_predicted),
            "red": int(red),
            "green": int(green),
            "blue": int(blue),
            "confidence": confidence
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 미리 학습된 모델 로드
@app.on_event("startup")
async def load_trained_model():
    global ph_model, ph_scaler
    try:
        # CSV 파일에서 데이터 로드
        df = pd.read_csv('ph_data.csv')
        X = df[['red', 'green', 'blue']]
        y = df['label']
        
        # 데이터 정규화
        ph_scaler = StandardScaler()
        X_scaled = ph_scaler.fit_transform(X)
        
        # 모델 훈련
        ph_model = KNeighborsRegressor(n_neighbors=min(5, len(X)))
        ph_model.fit(X_scaled, y)
        
        logger.info("KNN 모델이 성공적으로 로드되었습니다.")
        logger.info(f"학습 데이터 수: {len(X)}")
        logger.info(f"pH 값 범위: {y.min()} ~ {y.max()}")
        logger.info(f"n_neighbors: {min(5, len(X))}")
        
        # 모델 성능 평가
        y_pred = ph_model.predict(X_scaled)
        mse = mean_squared_error(y, y_pred)
        r2 = r2_score(y, y_pred)
        logger.info(f"모델 성능:")
        logger.info(f"- MSE: {mse:.4f}")
        logger.info(f"- R2 Score: {r2:.4f}")
    except Exception as e:
        logger.error(f"모델 로드 중 오류 발생: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000) 