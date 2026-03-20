import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

// ========================================
// PASTE YOUR FIREBASE CONFIG BELOW
// Get it from: Firebase Console → Project Settings → Your Apps → Web
// ========================================
const firebaseConfig = {
  apiKey: "AIzaSyCpLhkDbFEQh9XNfQEfGOfE8BPcRhAEf0A",
  authDomain: "birthday-trip-planner.firebaseapp.com",
  databaseURL: "https://birthday-trip-planner-default-rtdb.firebaseio.com",
  projectId: "birthday-trip-planner",
  storageBucket: "birthday-trip-planner.firebasestorage.app",
  messagingSenderId: "1037760808515",
  appId: "1:1037760808515:web:3235dc85e80761ba6376f6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, onValue };
