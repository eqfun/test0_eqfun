import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";
import { auth } from './firebase-config.js';

const storage = getStorage();

// 프로필 사진 업로드
export async function uploadProfilePhoto(file) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');

    // 파일 타입 검사
    if (!file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드 가능합니다.');
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('파일 크기는 5MB를 초과할 수 없습니다.');
    }

    // 스토리지 경로 설정
    const storageRef = ref(storage, `profile_photos/${user.uid}/${file.name}`);
    
    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file);
    
    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('프로필 사진 업로드 중 오류 발생:', error);
    throw error;
  }
}

// 프로필 사진 URL 가져오기
export async function getProfilePhotoUrl(uid) {
  try {
    const storageRef = ref(storage, `profile_photos/${uid}/profile.jpg`);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('프로필 사진 URL 가져오기 중 오류 발생:', error);
    return null;
  }
}

// 프로필 사진 삭제
export async function deleteProfilePhoto(uid) {
  try {
    const storageRef = ref(storage, `profile_photos/${uid}/profile.jpg`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('프로필 사진 삭제 중 오류 발생:', error);
    throw error;
  }
} 