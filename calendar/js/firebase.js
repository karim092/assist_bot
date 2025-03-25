import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBPb2LNteDn8B1ZqqeGsZFoZK6lwCr730o",
    authDomain: "assistentbot-886e7.firebaseapp.com",
    projectId: "assistentbot-886e7",
    storageBucket: "assistentbot-886e7.firebasestorage.app",
    messagingSenderId: "867234276353",
    appId: "1:867234276353:web:06038dc8caaff9a4e40c00",
    measurementId: "G-3WVQ1LNK9B"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc, addDoc, Timestamp };