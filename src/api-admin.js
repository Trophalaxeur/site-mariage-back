import * as admin from 'firebase-admin';
import serviceAccount from './credentials.json';
// Initialize Firebase
const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
};

// the root app just in case we need it
const firebaseApp = admin.initializeApp(firebaseConfig);

export const db = firebaseApp.database(); // the real-time database
export const auth = firebaseApp.auth(); // the firebase auth namespace
