import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const defaultConfig = {
  apiKey: 'AIzaSyCvLQzyqE4LvIJcI1w9NRyqa4j9Jhd_D5c',
  authDomain: 'gymflow-a7664.firebaseapp.com',
  projectId: 'gymflow-a7664',
  storageBucket: 'gymflow-a7664.firebasestorage.app',
  messagingSenderId: '849718336345',
  appId: '1:849718336345:web:c10a1b66222b74c6058a48',
  measurementId: 'G-84XBWRH05G',
}

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaultConfig.measurementId,
}

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)
export const firebaseApp = firebaseConfigured
  ? (getApps().length > 0 ? getApp() : initializeApp(config))
  : null
export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const db = firebaseApp ? getFirestore(firebaseApp) : null

export const signInWithGoogle = async () => {
  if (!auth) return null
  return signInWithPopup(auth, new GoogleAuthProvider())
}

export const logout = async () => {
  if (auth) await signOut(auth)
}
