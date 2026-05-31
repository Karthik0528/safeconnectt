import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCt3r3SSJMsMPwXDz1KzR7cwzeKQF7Xj3Q",
  authDomain: "safeconnect-8ed2d.firebaseapp.com",
  projectId: "safeconnect-8ed2d",
  storageBucket: "safeconnect-8ed2d.firebasestorage.app",
  messagingSenderId: "399510051307",
  appId: "1:399510051307:web:d282f3ffd12c9decace1ae",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);