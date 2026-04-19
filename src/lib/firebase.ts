import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Ensure Firestore is only initialized once with specific settings
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  // If already initialized (common in HMR), retrieve existing instance
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = dbInstance;
export const auth = getAuth(app);

// Connectivity Test as per system instructions
export async function testFirestoreConnection() {
  try {
    // Attempt to fetch a non-existent doc from server to verify pipe
    const testDoc = doc(db, '_system_', 'health_ping');
    await getDocFromServer(testDoc);
    console.log("[Firebase] Firestore connectivity verified.");
  } catch (error: any) {
    if (error.message?.includes('the client is offline') || error.code === 'unavailable') {
      console.warn("[Firebase] Firestore unavailable. Check if the database instance exists and the environment allows outgoing traffic.");
    } else if (error.code === 'permission-denied') {
      console.log("[Firebase] Firestore reached but permission denied (expected for health ping).");
    } else {
      console.error("[Firebase] Firestore connection test failed:", error);
    }
  }
}
