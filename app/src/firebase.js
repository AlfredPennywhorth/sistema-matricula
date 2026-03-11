import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCA-RAplbPKddms1cavzrilThOwandPxf4",
  authDomain: "sistema-matriculas-61a80.firebaseapp.com",
  projectId: "sistema-matriculas-61a80",
  storageBucket: "sistema-matriculas-61a80.firebasestorage.app",
  messagingSenderId: "1057652173712",
  appId: "1:1057652173712:web:76ed1a352bbea19792a115",
  measurementId: "G-Q8CPZS1NZC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
