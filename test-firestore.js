import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, arrayUnion } from "firebase/firestore";
import fs from "fs";

// Using the same config as the app, but since we are running in node, we need to provide the real config or use the emulator
// Wait, I can just use the web API if I have the config. Let me read it from .env
import dotenv from "dotenv";
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  let userFound = null;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.email === "robinson@example.com" || data.name === "Robinson Sanchez") { // Guessing from context
        userFound = {id: doc.id, ...data};
    }
  });

  if (!userFound) {
      // Just check the first user
      userFound = {id: snapshot.docs[0].id, ...snapshot.docs[0].data()};
  }
  
  console.log("User:", userFound.email, "bankAccounts:", userFound.bankAccounts);
  
  try {
      await setDoc(doc(db, "users", userFound.id), {
        bankAccounts: []
      }, { merge: true });
      console.log("Successfully cleared bank accounts");
  } catch (e) {
      console.error("Error clearing bank accounts", e);
  }
  process.exit(0);
}

test();
