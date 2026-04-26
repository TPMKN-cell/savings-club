// ─── Firebase Config ──────────────────────────────────────────────────────────
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (free)
// 3. Add a Web app
// 4. Copy your config here
// 5. Go to Firestore Database → Create database → Start in test mode

import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYUFPaUX7MlAGxh9XSDVzrHL84ewkGMdw",
  authDomain: "smtsujay.firebaseapp.com",
  projectId: "smtsujay",
  storageBucket: "smtsujay.firebasestorage.app",
  messagingSenderId: "532191762518",
  appId: "1:532191762518:web:ad2ee15e2c60a6fd6543f7"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const DOC_REF = () => doc(db, "club", "data");

// Read once
export async function dbRead() {
  try {
    const { getDoc } = await import("firebase/firestore");
    const snap = await getDoc(DOC_REF());
    return snap.exists() ? snap.data().payload : null;
  } catch (e) {
    console.error("dbRead error", e);
    return null;
  }
}

// Write
export async function dbWrite(data) {
  try {
    await setDoc(DOC_REF(), { payload: data });
  } catch (e) {
    console.error("dbWrite error", e);
  }
}

// Delete
export async function dbClear() {
  try {
    await deleteDoc(DOC_REF());
  } catch (e) {
    console.error("dbClear error", e);
  }
}

// Live listener — calls callback whenever data changes
export function dbListen(callback) {
  return onSnapshot(DOC_REF(), (snap) => {
    if (snap.exists()) {
      callback(snap.data().payload);
    } else {
      callback(null);
    }
  });
}
