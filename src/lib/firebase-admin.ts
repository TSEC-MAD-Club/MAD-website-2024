// lib/firebase-admin.ts
import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

if (!getApps().length) {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_TSEC_APP) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_TSEC_APP environment variable is not set")
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_TSEC_APP);
    initializeApp({
      credential: cert(serviceAccount),
    })
    console.log("✅ Firebase Admin initialized")
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error)
    throw new Error("Failed to initialize Firebase Admin")
  }
}

export const dbAdmin = getFirestore()
