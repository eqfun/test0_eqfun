from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import firebase_admin
from firebase_admin import credentials, auth, firestore
import json
from datetime import datetime
import cv2
import numpy as np
from PIL import Image
import io
import base64
import concurrent.futures
import time

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Firebase 초기화
cred = credentials.Certificate('firebase/serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firebase_admin.firestore.client()

# 정적 파일 경로 설정
app.static_folder = '.'
app.static_url_path = ''

# 화학평형 관련 지식 베이스
CHEMISTRY_KNOWLEDGE = {
    "르샤틀리에 원리": {
        "description": "르샤틀리에 원리는 화학 평형에 영향을 주는 조건이 변화할 때, 그 변화를 상쇄하는 방향으로 평형이 이동하는 원리입니다.",
        "examples": [
            "온도가 증가하면 발열 반응의 반응물 쪽으로 평형이 이동합니다.",
            "압력이 증가하면 기체의 몰수가 적은 쪽으로 평형이 이동합니다.",
            "농도가 증가하면 그 물질을 소비하는 방향으로 평형이 이동합니다."
        ],
        "daily_life": [
            "탄산음료를 마실 때: 병을 열면 압력이 감소하여 CO₂가 빠져나가고, 평형이 기체 생성 쪽으로 이동합니다.",
            "요리할 때: 고기나 생선을 익히면 단백질이 변성되어 평형이 이동합니다.",
            "운동할 때: 근육에서 젖산이 생성되어 pH가 낮아지면, 체내의 완충계가 작동하여 평형을 유지합니다."
        ]
    },
    "화학평형": {
        "description": "화학평형은 정반응과 역반응의 속도가 같아져서 겉으로 보기에 반응이 멈춘 것처럼 보이는 상태입니다.",
        "examples": [
            "N₂ + 3H₂ ⇌ 2NH₃",
            "2SO₂ + O₂ ⇌ 2SO₃",
            "H₂ + I₂ ⇌ 2HI"
        ],
        "daily_life": [
            "호흡: 우리 몸에서 산소와 이산화탄소의 교환이 평형 상태를 유지합니다.",
            "혈액: 혈액의 pH가 7.4로 일정하게 유지되는 것은 여러 완충계의 평형 때문입니다.",
            "수족관: 물고기의 호흡과 식물의 광합성이 평형을 이루어 산소 농도가 유지됩니다."
        ]
    },
    "평형상수": {
        "description": "평형상수(K)는 평형 상태에서 반응물과 생성물의 농도 비율을 나타내는 값입니다.",
        "formula": "K = [생성물]^n / [반응물]^m",
        "daily_life": [
            "혈액의 산소 농도: 헤모글로빈과 산소의 결합 평형상수가 일정하게 유지됩니다.",
            "체내 pH: 체액의 pH가 일정하게 유지되는 것은 여러 평형상수가 조화를 이루기 때문입니다.",
            "소화: 위액의 산성도가 일정하게 유지되는 것은 평형상수의 원리 때문입니다."
        ]
    },
    "암모니아 합성": {
        "description": "암모니아 합성은 질소와 수소가 반응하여 암모니아를 생성하는 과정입니다.",
        "examples": [
            "N₂ + 3H₂ ⇌ 2NH₃ + 열",
            "이 반응은 발열 반응이므로 온도가 낮을수록 암모니아 생성이 유리합니다.",
            "압력이 높을수록 기체의 몰수가 감소하는 방향으로 평형이 이동합니다."
        ],
        "daily_life": [
            "비료 제조: 암모니아는 질소 비료의 원료로 사용됩니다.",
            "세제: 암모니아는 세척제의 성분으로 사용됩니다.",
            "냉장고: 과거에는 암모니아가 냉매로 사용되었습니다."
        ]
    },
    "산-염기 평형": {
        "description": "산-염기 평형은 수소 이온(H⁺)과 수산화 이온(OH⁻)의 농도가 일정하게 유지되는 상태입니다.",
        "examples": [
            "HA ⇌ H⁺ + A⁻",
            "BOH ⇌ B⁺ + OH⁻",
            "H₂O ⇌ H⁺ + OH⁻"
        ],
        "daily_life": [
            "위산: 위에서 분비되는 염산은 음식물 소화에 중요한 역할을 합니다.",
            "혈액: 혈액의 pH가 7.4로 유지되는 것은 생명에 매우 중요합니다.",
            "토양: 작물 재배에 적합한 pH 범위가 있습니다.",
            "수영장: 염소 소독제의 효과는 pH에 따라 달라집니다."
        ]
    },
    "pH 측정 프로그램": {
        "description": "pH 측정 프로그램은 만능시험지의 색깔을 분석하여 pH 값을 예측하는 프로그램입니다.",
        "features": [
            "만능시험지의 사진을 찍거나 업로드할 수 있습니다.",
            "시험지의 색깔을 분석하여 pH 값을 예측합니다.",
            "예측된 pH 값에 따라 산성, 중성, 염기성을 알려줍니다.",
            "측정 결과를 저장하고 확인할 수 있습니다."
        ],
        "how_to_use": [
            "1. 만능시험지를 흰색 배경 앞에 놓습니다.",
            "2. 카메라로 시험지를 촬영하거나 사진을 업로드합니다.",
            "3. 프로그램이 시험지를 인식하고 색깔을 분석합니다.",
            "4. 분석 결과에 따라 pH 값과 산성/염기성을 표시합니다."
        ],
        "tips": [
            "시험지는 흰색 배경 앞에서 촬영하면 더 정확한 결과를 얻을 수 있습니다.",
            "시험지가 잘 보이도록 카메라를 가까이 대주세요.",
            "빛이 충분한 곳에서 촬영하면 더 정확한 색상 분석이 가능합니다."
        ]
    },
    "만능시험지": {
        "description": "만능시험지는 용액의 pH 값을 측정하는 종이입니다.",
        "characteristics": [
            "pH 0-14 범위의 색상 변화를 보여줍니다.",
            "산성(빨강)에서 염기성(파랑)까지 다양한 색상으로 변화합니다.",
            "정확한 pH 측정을 위해 흰색 배경에서 관찰해야 합니다."
        ],
        "color_meaning": {
            "빨강": "강한 산성 (pH 0-3)",
            "주황": "중간 산성 (pH 4-5)",
            "노랑": "약한 산성 (pH 6)",
            "초록": "중성 (pH 7)",
            "파랑": "염기성 (pH 8-14)"
        }
    }
}

# 질문 패턴 정의
QUESTION_PATTERNS = {
    "르샤틀리에 원리": {
        "keywords": ["르샤틀리에", "평형이동", "평형 이동", "평형", "원리", "이해", "알려줘", "설명해줘", "뭐니", "뭐야", "무엇", "어떻게", "왜"],
        "questions": [
            "어떻게", "왜", "무엇", "어떤", "뭐니", "뭐야", "알려줘", "설명해줘", "가르쳐줘", "말해줘",
            "어떻게 작동", "어떻게 적용", "어떻게 사용", "어떻게 이해", "어떻게 설명",
            "왜 중요", "왜 필요", "왜 사용", "왜 이해", "왜 설명",
            "무엇인가", "무엇이니", "무엇이야", "무엇인지", "무엇인가요",
            "어떤 원리", "어떤 의미", "어떤 역할", "어떤 중요성", "어떤 적용"
        ]
    },
    "화학평형": {
        "keywords": ["화학평형", "평형", "화학", "반응", "원리", "이해", "알려줘", "설명해줘", "뭐니", "뭐야", "무엇", "어떻게", "왜"],
        "questions": [
            "어떻게", "왜", "무엇", "어떤", "뭐니", "뭐야", "알려줘", "설명해줘", "가르쳐줘", "말해줘",
            "어떻게 작동", "어떻게 적용", "어떻게 사용", "어떻게 이해", "어떻게 설명",
            "왜 중요", "왜 필요", "왜 사용", "왜 이해", "왜 설명",
            "무엇인가", "무엇이니", "무엇이야", "무엇인지", "무엇인가요",
            "어떤 원리", "어떤 의미", "어떤 역할", "어떤 중요성", "어떤 적용"
        ]
    },
    "평형상수": {
        "keywords": ["평형상수", "상수", "평형", "계산", "원리", "이해", "알려줘", "설명해줘", "뭐니", "뭐야", "무엇", "어떻게", "왜"],
        "questions": [
            "어떻게", "왜", "무엇", "어떤", "뭐니", "뭐야", "알려줘", "설명해줘", "가르쳐줘", "말해줘",
            "어떻게 계산", "어떻게 구해", "어떻게 사용", "어떻게 이해", "어떻게 설명",
            "왜 중요", "왜 필요", "왜 사용", "왜 이해", "왜 설명",
            "무엇인가", "무엇이니", "무엇이야", "무엇인지", "무엇인가요",
            "어떤 의미", "어떤 역할", "어떤 중요성", "어떤 적용", "어떤 계산"
        ]
    },
    "암모니아 합성": {
        "keywords": ["암모니아", "합성", "하버", "보슈", "반응", "원리", "이해", "알려줘", "설명해줘", "뭐니", "뭐야", "무엇", "어떻게", "왜"],
        "questions": [
            "어떻게", "왜", "무엇", "어떤", "뭐니", "뭐야", "알려줘", "설명해줘", "가르쳐줘", "말해줘",
            "어떻게 만들", "어떻게 합성", "어떻게 생산", "어떻게 이해", "어떻게 설명",
            "왜 중요", "왜 필요", "왜 사용", "왜 이해", "왜 설명",
            "무엇인가", "무엇이니", "무엇이야", "무엇인지", "무엇인가요",
            "어떤 과정", "어떤 의미", "어떤 역할", "어떤 중요성", "어떤 적용"
        ]
    },
    "산-염기 평형": {
        "keywords": ["산", "염기", "평형", "pH", "중화", "원리", "이해", "알려줘", "설명해줘", "뭐니", "뭐야", "무엇", "어떻게", "왜"],
        "questions": [
            "어떻게", "왜", "무엇", "어떤", "뭐니", "뭐야", "알려줘", "설명해줘", "가르쳐줘", "말해줘",
            "어떻게 작동", "어떻게 적용", "어떻게 사용", "어떻게 이해", "어떻게 설명",
            "왜 중요", "왜 필요", "왜 사용", "왜 이해", "왜 설명",
            "무엇인가", "무엇이니", "무엇이야", "무엇인지", "무엇인가요",
            "어떤 원리", "어떤 의미", "어떤 역할", "어떤 중요성", "어떤 적용"
        ]
    },
    "pH 측정": {
        "keywords": ["pH", "측정", "산성", "염기성", "지시약", "원리", "이해", "알려줘", "설명해줘", "뭐니", "뭐야", "무엇", "어떻게", "왜"],
        "questions": [
            "어떻게", "왜", "무엇", "어떤", "뭐니", "뭐야", "알려줘", "설명해줘", "가르쳐줘", "말해줘",
            "어떻게 측정", "어떻게 확인", "어떻게 사용", "어떻게 이해", "어떻게 설명",
            "왜 중요", "왜 필요", "왜 사용", "왜 이해", "왜 설명",
            "무엇인가", "무엇이니", "무엇이야", "무엇인지", "무엇인가요",
            "어떤 방법", "어떤 의미", "어떤 역할", "어떤 중요성", "어떤 적용"
        ]
    }
}

# pH 측정 관련 상수
PH_COLORS = {
    'red': (0, 3),      # 강한 산성
    'orange': (4, 5),   # 중간 산성
    'yellow': (6, 6),   # 약한 산성
    'green': (7, 7),    # 중성
    'blue': (8, 14)     # 염기성
}

def analyze_ph_image(image_data):
    try:
        start_time = time.time()
        
        # Base64 이미지 데이터를 OpenCV 형식으로 변환
        image_data = base64.b64decode(image_data.split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # 이미지 크기 조정 (처리 속도 향상)
        scale_percent = 50  # 이미지 크기를 50%로 축소
        width = int(img.shape[1] * scale_percent / 100)
        height = int(img.shape[0] * scale_percent / 100)
        img = cv2.resize(img, (width, height), interpolation=cv2.INTER_AREA)
        
        # 이미지 전처리 (병렬 처리)
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # HSV 변환
            hsv_future = executor.submit(cv2.cvtColor, img, cv2.COLOR_BGR2HSV)
            # 가우시안 블러
            blur_future = executor.submit(cv2.GaussianBlur, img, (5, 5), 0)
            
            hsv = hsv_future.result()
            blurred = blur_future.result()
        
        # 색상 분석 (병렬 처리)
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # 평균 색상 계산
            avg_hue = np.mean(hsv[:,:,0])
            avg_saturation = np.mean(hsv[:,:,1])
            avg_value = np.mean(hsv[:,:,2])
            
            # RGB 채널 분석
            b, g, r = cv2.split(blurred)
            avg_r = np.mean(r)
            avg_g = np.mean(g)
            avg_b = np.mean(b)
        
        # 색상 기반 pH 값 추정 (개선된 알고리즘)
        if avg_hue < 10 and avg_saturation > 100:  # 빨간색
            ph_range = PH_COLORS['red']
        elif avg_hue < 20 and avg_saturation > 80:  # 주황색
            ph_range = PH_COLORS['orange']
        elif avg_hue < 30 and avg_saturation > 60:  # 노란색
            ph_range = PH_COLORS['yellow']
        elif avg_hue < 100 and avg_saturation > 40:  # 초록색
            ph_range = PH_COLORS['green']
        else:  # 파란색
            ph_range = PH_COLORS['blue']
        
        # RGB 값 기반 보정
        if avg_r > avg_g and avg_r > avg_b:  # 빨간색 강조
            ph_value = max(ph_range[0], ph_value - 0.5)
        elif avg_b > avg_r and avg_b > avg_g:  # 파란색 강조
            ph_value = min(ph_range[1], ph_value + 0.5)
        
        ph_value = np.mean(ph_range)
        
        # 결과 설명 생성
        if ph_value < 7:
            description = "산성입니다."
        elif ph_value > 7:
            description = "염기성입니다."
        else:
            description = "중성입니다."
        
        end_time = time.time()
        processing_time = end_time - start_time
        print(f"이미지 처리 시간: {processing_time:.3f}초")
        
        return {
            'success': True,
            'ph_value': round(ph_value, 1),
            'description': description,
            'processing_time': round(processing_time, 3)
        }
        
    except Exception as e:
        print(f"이미지 분석 중 오류 발생: {str(e)}")
        return {
            'success': False,
            'error': '이미지 분석에 실패했습니다. 다시 시도해주세요.'
        }

@app.route('/analyze-ph', methods=['POST'])
def analyze_ph():
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({
                'success': False,
                'error': '이미지 데이터가 없습니다.'
            })
            
        result = analyze_ph_image(image_data)
        return jsonify(result)
        
    except Exception as e:
        print(f"pH 분석 요청 처리 중 오류 발생: {str(e)}")
        return jsonify({
            'success': False,
            'error': '서버 오류가 발생했습니다.'
        })

# 응답 생성 함수
def generate_chatbot_response(message):
    # 소문자로 변환하여 비교
    message = message.lower()
    
    # 인사말 체크
    if any(greeting in message for greeting in ["안녕", "안녕하세요", "하이", "hi", "hello"]):
        return "안녕하세요! 😊 화학평형에 대해 궁금한 점이 있으신가요?"
    
    # 감사 표현 체크
    if any(thanks in message for thanks in ["감사", "고마워", "고맙", "thank"]):
        return "천만에요! 😊 더 궁금한 점이 있으시다면 언제든 물어보세요!"
    
    # 도움 요청 체크
    help_keywords = ["도움", "도와", "알려", "설명", "가르쳐", "말해", "뭐", "무엇", "어떻게", "왜"]
    if any(keyword in message for keyword in help_keywords):
        return """도와드릴게요! 😊 다음 주제들에 대해 물어보실 수 있어요:

1. 르샤틀리에 원리
2. 화학평형
3. 평형상수
4. 암모니아 합성
5. 산-염기 평형
6. pH 측정

어떤 것에 대해 알고 싶으신가요?"""
    
    # 주제별 응답 생성
    for topic, patterns in QUESTION_PATTERNS.items():
        # 키워드 체크
        if any(keyword in message for keyword in patterns["keywords"]):
            # 질문 패턴 체크
            if any(question in message for question in patterns["questions"]):
                # 사용자의 말투 감지 (반말/존댓말)
                is_casual = any(casual in message for casual in ["니", "야", "해", "줘"])
                
                if topic == "르샤틀리에 원리":
                    response = "르샤틀리에 원리는 화학평형에서 외부 조건이 변화할 때, 평형이 그 변화를 최소화하는 방향으로 이동하는 원리예요. "
                    if is_casual:
                        response += "예를 들어, 온도를 높이면 반응이 열을 흡수하는 방향으로 진행돼. 이렇게 평형이 이동하면서 새로운 평형 상태에 도달하게 되지!"
                    else:
                        response += "예를 들어, 온도를 높이면 반응이 열을 흡수하는 방향으로 진행됩니다. 이렇게 평형이 이동하면서 새로운 평형 상태에 도달하게 됩니다."
                
                elif topic == "화학평형":
                    response = "화학평형은 정반응과 역반응의 속도가 같아져서 겉보기에 반응이 멈춘 것처럼 보이는 상태를 말해요. "
                    if is_casual:
                        response += "이건 마치 양쪽에서 똑같은 속도로 물을 주고받는 것과 비슷해. 겉보기에는 변화가 없지만, 실제로는 계속 반응이 일어나고 있지!"
                    else:
                        response += "이는 마치 양쪽에서 똑같은 속도로 물을 주고받는 것과 비슷합니다. 겉보기에는 변화가 없지만, 실제로는 계속 반응이 일어나고 있습니다."
                
                elif topic == "평형상수":
                    response = "평형상수는 화학평형에서 반응물과 생성물의 농도 비를 나타내는 상수예요. "
                    if is_casual:
                        response += "이 값이 크면 생성물이 많고, 작으면 반응물이 많은 거야. 온도에만 영향을 받고 농도나 압력에는 영향을 받지 않아!"
                    else:
                        response += "이 값이 크면 생성물이 많고, 작으면 반응물이 많습니다. 온도에만 영향을 받고 농도나 압력에는 영향을 받지 않습니다."
                
                elif topic == "암모니아 합성":
                    response = "암모니아 합성은 하버-보슈법을 통해 질소와 수소를 반응시켜 암모니아를 만드는 과정이에요. "
                    if is_casual:
                        response += "이 반응은 고온고압에서 촉매를 사용해서 진행돼. 르샤틀리에 원리에 따라 온도를 낮추고 압력을 높이면 암모니아의 수율이 높아져!"
                    else:
                        response += "이 반응은 고온고압에서 촉매를 사용해서 진행됩니다. 르샤틀리에 원리에 따라 온도를 낮추고 압력을 높이면 암모니아의 수율이 높아집니다."
                
                elif topic == "산-염기 평형":
                    response = "산-염기 평형은 물에서 일어나는 수소 이온의 이동과 관련된 평형이에요. "
                    if is_casual:
                        response += "산은 수소 이온을 내놓고, 염기는 수소 이온을 받아. 이렇게 수소 이온의 이동이 평형을 이루면서 pH가 결정되는 거야!"
                    else:
                        response += "산은 수소 이온을 내놓고, 염기는 수소 이온을 받습니다. 이렇게 수소 이온의 이동이 평형을 이루면서 pH가 결정됩니다."
                
                elif topic == "pH 측정":
                    response = "pH는 용액의 산성도를 나타내는 지표예요. "
                    if is_casual:
                        response += "만능시험지나 pH 미터로 측정할 수 있어. pH가 7보다 작으면 산성, 크면 염기성, 7이면 중성이야!"
                    else:
                        response += "만능시험지나 pH 미터로 측정할 수 있습니다. pH가 7보다 작으면 산성, 크면 염기성, 7이면 중성입니다."
                
                return response
    
    # 이해하지 못한 질문에 대한 응답
    return "죄송해요. 질문을 이해하지 못했어요. 😅 다시 한번 다른 방식으로 물어보시겠어요? '도움말'을 입력하시면 제가 도와드릴 수 있는 주제들을 알려드릴게요!"

# 정적 파일 서빙
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/chatbot-server/<path:path>')
def serve_chatbot(path):
    return send_from_directory('chatbot-server', path)

# WebSocket 이벤트 핸들러
@socketio.on('connect')
def handle_connect():
    print('클라이언트 연결됨')
    emit('connection_response', {'data': '연결 성공'})

@socketio.on('message')
def handle_message(data):
    try:
        message = data.get('message')
        if not message:
            socketio.emit('error', {'error': '메시지를 받지 못했습니다.'})
            return

        print(f"받은 메시지: {message}")
        
        # 응답 생성
        response = generate_chatbot_response(message)
        print(f"생성된 응답: {response}")
        
        # 응답을 한 글자씩 전송
        for i, char in enumerate(response):
            socketio.emit('stream', {
                'char': char,
                'is_last': i == len(response) - 1
            })
            socketio.sleep(0.05)  # 50ms 딜레이
            
    except Exception as e:
        print(f"메시지 처리 중 오류 발생: {str(e)}")
        socketio.emit('error', {'error': '메시지 처리 중 오류가 발생했습니다.'})

@socketio.on('disconnect')
def handle_disconnect():
    print('클라이언트 연결 해제')

if __name__ == '__main__':
    print('서버 시작...')
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True) 