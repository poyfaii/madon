// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCDAaW-OyL_13qkF7sCxXkMhpJyrOtntjg",
  authDomain: "orders-3d979.firebaseapp.com",
  databaseURL: "https://orders-3d979-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "orders-3d979",
  storageBucket: "orders-3d979.firebasestorage.app",
  messagingSenderId: "1048840913149",
  appId: "1:1048840913149:web:4f1b772b853b602cc93e94",
  measurementId: "G-P5JPR90CX8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);