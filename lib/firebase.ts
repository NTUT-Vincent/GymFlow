import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)
export const firebaseApp = firebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(config)
  : null
export const auth = firebaseApp && typeof window !== 'undefined' ? getAuth(firebaseApp) : null
export const db = firebaseApp && typeof window !== 'undefined' ? getFirestore(firebaseApp) : null

export type FirebaseUser = User | null

export const signInWithGoogle = async () => {
  if (!auth) return null
  return signInWithPopup(auth, new GoogleAuthProvider())
}

export const logout = async () => {
  if (auth) await signOut(auth)
}
