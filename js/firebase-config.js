// ── REACH Lab — Firebase Config ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyDiAo7qQ0jH1AqPCgdsDncASYCy9UWROdo",
  authDomain:        "reach-lab-10429.firebaseapp.com",
  projectId:         "reach-lab-10429",
  storageBucket:     "reach-lab-10429.firebasestorage.app",
  messagingSenderId: "81038102710",
  appId:             "1:81038102710:web:30303594362513355f9617"
};

firebase.initializeApp(firebaseConfig);

const db   = firebase.firestore();
const auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
