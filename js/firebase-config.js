// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBE0r282qiZAoL6MCYbpLt-Zmxp7JDYMVk",
  authDomain: "test-equilibrifun.firebaseapp.com",
  projectId: "test-equilibrifun",
  storageBucket: "test-equilibrifun.firebasestorage.app",
  messagingSenderId: "804507284339",
  appId: "1:804507284339:web:d03de182b9e8fadccb0b06",
  measurementId: "G-HXPF6NZE8D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };
