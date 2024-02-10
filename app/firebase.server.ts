import { App, initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

let app: App;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId: "",
      privateKey: "",
      clientEmail: "",
    }),
  });
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
