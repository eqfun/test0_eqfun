import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs, addDoc, orderBy } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { auth } from './firebase-config.js';

const db = getFirestore();

// 사용자 프로필 생성/업데이트
export async function createOrUpdateUserProfile(user, additionalData = {}) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // 새 사용자 프로필 생성
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'student', // 기본값은 학생
        isActive: true,
        score: 0,
        lastLogin: new Date(),
        createdAt: new Date(),
        ...additionalData
      });
    } else {
      // 기존 사용자 프로필 업데이트
      await updateDoc(userRef, {
        displayName: user.displayName || userDoc.data().displayName,
        photoURL: user.photoURL || userDoc.data().photoURL,
        lastLogin: new Date(),
        ...additionalData
      });
    }
  } catch (error) {
    console.error('사용자 프로필 업데이트 중 오류 발생:', error);
    throw error;
  }
}

// 사용자 역할 확인
export async function checkUserRole(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return 'student'; // 기본값은 학생
  } catch (error) {
    console.error('사용자 역할 확인 중 오류 발생:', error);
    return 'student';
  }
}

// 사용자 점수 업데이트
export async function updateUserScore(uid, score) {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      score: score,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('사용자 점수 업데이트 중 오류 발생:', error);
    throw error;
  }
}

// 사용자 활동 상태 업데이트
export async function updateUserActivity(uid, isActive) {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isActive: isActive,
      lastActivity: new Date()
    });
  } catch (error) {
    console.error('사용자 활동 상태 업데이트 중 오류 발생:', error);
    throw error;
  }
}

// 로그인 기록 저장
export async function saveLoginLog(user, ipAddress, userAgent) {
  try {
    const logsRef = collection(db, 'login_logs');
    await addDoc(logsRef, {
      userId: user.uid,
      email: user.email,
      timestamp: new Date(),
      ipAddress: ipAddress,
      userAgent: userAgent
    });
  } catch (error) {
    console.error('로그인 기록 저장 중 오류 발생:', error);
    throw error;
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
    throw error;
  }
} 