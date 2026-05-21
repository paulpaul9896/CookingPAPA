import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'REMOVED_FIREBASE_API_KEY',
  authDomain: 'cooking-papa-51c66.firebaseapp.com',
  projectId: 'cooking-papa-51c66',
  storageBucket: 'cooking-papa-51c66.firebasestorage.app',
  messagingSenderId: '410761551111',
  appId: '1:410761551111:web:dc11932400d524615739a2',
  measurementId: 'G-3B1ZTPXBZE',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const APP_ID = 'cooking-papa-app';

export {
  signInAnonymously,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
};
