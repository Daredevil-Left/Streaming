// Importamos las herramientas de Firebase que necesitamos
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// ==========================================================
// ¡IMPORTANTE! Pega aquí tus credenciales de Firebase
// ==========================================================
const firebaseConfig = {
    apiKey: "AIzaSyCaYzhFY6keITDiN2Dn7kyEAnGPDt0hu2A",
    authDomain: "streaming-d0fac.firebaseapp.com",
    projectId: "streaming-d0fac",
    storageBucket: "streaming-d0fac.firebasestorage.app",
    messagingSenderId: "1017661259961",
    appId: "1:1017661259961:web:9303ad97c753fe95379b68"
};

// Conectamos con Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Obtenemos el servicio de autenticación

// Apuntamos a los elementos del formulario HTML
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

// Creamos un "escuchador" que se activa cuando le das al botón "Entrar"
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Esto evita que la página se recargue

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        // Intentamos iniciar sesión con la función de Firebase
        await signInWithEmailAndPassword(auth, email, password);
        
        // Si tiene éxito, nos redirige a la página principal
        window.location.href = 'index.html';

    } catch (error) {
        // Si falla (contraseña incorrecta, etc.), mostramos un mensaje
        console.error("Error de inicio de sesión:", error.code);
        errorMessage.textContent = "Correo o contraseña incorrectos. Inténtalo de nuevo.";
    }
});