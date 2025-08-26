// FirebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCbcDCBn2iqGlB16vLxpcJeqbngdQ06b20",
  authDomain: "apptestelogin-e98b3.firebaseapp.com",
  projectId: "apptestelogin-e98b3",
  storageBucket: "apptestelogin-e98b3.firebasestorage.app",
  messagingSenderId: "30068450757",
  appId: "1:30068450757:web:58775b6f09dfd0aefed7ac",
  measurementId: "G-T78BHC9MN5"
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