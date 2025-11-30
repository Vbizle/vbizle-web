import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCItAB0IUES95OEUoCCCjI3Hib1usq1UnM",
  authDomain: "vbizle-f018f.firebaseapp.com",
  databaseURL: "https://vbizle-f018f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "vbizle-f018f",
  storageBucket: "vbizle-f018f.firebasestorage.app",
  messagingSenderId: "559906574145",
  appId: "1:559906574145:web:da802868ae6ede79931bc0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
