// ── REACH Lab — Firebase Config ──────────────────────────────────────────────
// Setup steps:
// 1. Go to https://console.firebase.google.com — create a project
// 2. Add a Web App — copy the config object below
// 3. Build → Firestore Database → Create database (Production mode)
// 4. Set Firestore security rules (see Task 6)
// 5. Build → Authentication → Sign-in method → enable Email/Password
// 6. Authentication → Users → add an account for each admin
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket:     "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId:             "REPLACE_WITH_YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const db   = firebase.firestore();
const auth = firebase.auth();
