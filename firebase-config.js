import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app-check.js";

// This is the single source of truth for the Firebase configuration.
const firebaseConfig = {
    apiKey: "AIzaSyCaYzhFY6keITDiN2Dn7kyEAnGPDt0hu2A",
    authDomain: "streaming-d0fac.firebaseapp.com",
    projectId: "streaming-d0fac",
    storageBucket: "streaming-d0fac.firebasestorage.app",
    messagingSenderId: "1017661259961",
    appId: "1:1017661259961:web:9303ad97c753fe95379b68"
};

// Initialize Firebase and export the necessary services.
const app = initializeApp(firebaseConfig);

// Initialize App Check
try {
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('53938c3d-b843-4742-9583-9cc3873d668b'),
      isTokenAutoRefreshEnabled: true
    });
} catch (error) {
    console.error("Error initializing App Check:", error);
}

export const auth = getAuth(app);
export const db = getFirestore(app);