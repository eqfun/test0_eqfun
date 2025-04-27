import { auth } from './firebase-config.js';
import { 
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const db = getFirestore();

// 로그인 기록 저장
export async function logLogin(user) {
  try {
    await addDoc(collection(db, 'login_logs'), {
      userId: user.uid,
      email: user.email,
      timestamp: serverTimestamp(),
      ip: await getClientIP(),
      userAgent: navigator.userAgent
    });
  } catch (error) {
    console.error('로그인 기록 저장 중 오류 발생:', error);
  }
}

// 최근 로그인 기록 조회
export async function getRecentLogins(userId, limit = 10) {
  try {
    const logsRef = collection(db, 'login_logs');
    const q = query(
      logsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('로그인 기록 조회 중 오류 발생:', error);
    return [];
  }
}

// 클라이언트 IP 주소 가져오기
async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'IP 주소 조회 실패';
  }
} 