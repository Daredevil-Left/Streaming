import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

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