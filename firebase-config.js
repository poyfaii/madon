// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCDAaW-OyL_13qkF7sCxXkMhpJyrOtntjg",
  authDomain: "orders-3d979.firebaseapp.com",
  databaseURL: "https://orders-3d979-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "orders-3d979",
  storageBucket: "orders-3d979.appspot.com",
  messagingSenderId: "1048840913149",
  appId: "1:1048840913149:web:4f1b772b853b602cc93e94",
  measurementId: "G-P5JPR90CX8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export สำหรับใช้งานในไฟล์อื่น
export {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  getDoc
};