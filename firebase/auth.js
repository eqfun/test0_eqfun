
// 로그인 기능
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      document.getElementById('login-message').innerText = "✅ 로그인 성공!";
      setTimeout(() => window.location.href = "../index.html", 1000);
    })
    .catch((error) => {
      document.getElementById('login-message').innerText = "❌ " + error.message;
    });
}

// 회원가입 기능
function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      document.getElementById('register-message').innerText = "✅ 회원가입 완료!";
      setTimeout(() => window.location.href = "login.html", 1000);
    })
    .catch((error) => {
      document.getElementById('register-message').innerText = "❌ " + error.message;
    });
}

// 로그인 상태 감지 및 사용자 표시
firebase.auth().onAuthStateChanged((user) => {
  const userInfoDiv = document.getElementById('user-info');
  if (user && userInfoDiv) {
    userInfoDiv.innerHTML = `
      <small style="color: #555;">
        👤 로그인: <b>${user.email}</b> |
        <a href="#" onclick="logout()" style="color: #c00; text-decoration: underline;">로그아웃</a>
      </small>
    `;
  }
});

// 로그아웃 기능
function logout() {
  firebase.auth().signOut().then(() => {
    alert("로그아웃 되었습니다.");
    window.location.href = "firebase/login.html";
  });
}
