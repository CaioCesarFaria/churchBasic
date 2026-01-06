// FirebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD4_ILQMJeCo5DeFBUx-OqdMNFwuOfNEqA",
  authDomain: "abbachurch-7651c.firebaseapp.com",
  projectId: "abbachurch-7651c",
  storageBucket: "abbachurch-7651c.firebasestorage.app",
  messagingSenderId: "995978437902",
  appId: "1:995978437902:web:952a36cb0084cb3cffa35f",
  measurementId: "G-KPKK2VN754"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth com persistência para React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // Se já foi inicializado, usar getAuth
  auth = getAuth(app);
}

// Inicializar Firestore Database
const db = getFirestore(app);

// Inicializar Storage
const storage = getStorage(app);

export { auth, db, storage };
export default app;