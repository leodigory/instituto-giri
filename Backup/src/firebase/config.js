import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCkEYlreLoQFqrdN8eKASS20a6DaLpJtYE",
  authDomain: "lista-de-compras-f67aa.firebaseapp.com",
  projectId: "lista-de-compras-f67aa",
  storageBucket: "lista-de-compras-f67aa.firebasestorage.app",
  messagingSenderId: "276613236544",
  appId: "1:276613236544:web:b5419812728802e013dca5",
  measurementId: "G-2HFQ3BGVVF",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
