// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRBjNZYxTNDXrnk7Xd8wSCVbyu1k95aNg",
  authDomain: "propix-dom.firebaseapp.com",
  projectId: "propix-dom",
  storageBucket: "propix-dom.firebasestorage.app",
  messagingSenderId: "355241893827",
  appId: "1:355241893827:web:9e47ab408f1589843de776",
  measurementId: "G-GBWX1M7H56"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
