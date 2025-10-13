// Importa las funciones necesarias de Firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// =================================================================
// ¡IMPORTANTE! AQUÍ DEBES PEGAR TUS CREDENCIALES DE FIREBASE
// Borra este bloque de ejemplo y pega tu propio objeto firebaseConfig
// =================================================================
const firebaseConfig = {
  apiKey: "AIzaSy...TU_API_KEY_VA_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// --- De aquí para abajo, el código funciona solo ---

// Inicializa la conexión con Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Apuntamos al formulario completo usando el ID que le pondremos en el HTML
const ventaForm = document.getElementById('ventaForm');

// Le decimos al formulario que "escuche" cuando alguien intente enviarlo (haciendo clic en el botón Guardar)
ventaForm.addEventListener('submit', async (e) => {
    // Esto es MUY importante. Evita que la página se recargue y se pierdan los datos.
    e.preventDefault(); 

    // Leemos el valor de CADA campo del formulario usando sus IDs
    const nombre = document.getElementById('nombreCliente').value;
    const plataforma = document.getElementById('plataforma').value;
    const precio = document.getElementById('precioPagado').value;
    const inicio = document.getElementById('inicioPlan').value;
    const dias = document.getElementById('numDias').value;
    const correo = document.getElementById('correo').value;
    const contrasena = document.getElementById('contrasena').value;
    const pin = document.getElementById('pin').value;
    const fin = document.getElementById('finPlan').value;
    const notas = document.getElementById('notasAdicionales').value;

    // Intentamos guardar los datos en la base de datos
    try {
        // Enviamos los datos a Firestore a una colección (una carpeta) llamada "ventas"
        await addDoc(collection(db, "ventas"), {
            nombreCliente: nombre,
            plataforma: plataforma,
            precioPagado: parseFloat(precio), // Convertimos el precio a número
            inicioPlan: inicio,
            numeroDias: parseInt(dias), // Convertimos los días a número
            correo: correo,
            contrasena: contrasena, // Recuerda la advertencia de seguridad sobre esto
            pin: pin,
            finPlan: fin,
            notas: notas,
            fechaRegistro: new Date() // Añadimos la fecha actual del registro
        });

        alert("✅ ¡Venta guardada con éxito!");
        ventaForm.reset(); // Limpia el formulario para que puedas añadir otra venta

    } catch (error) {
        console.error("Error al guardar la venta: ", error);
        alert("❌ Ocurrió un error. Revisa la consola (F12) para más detalles.");
    }
});