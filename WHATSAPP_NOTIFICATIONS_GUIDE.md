# Guía de Configuración de Notificaciones Automáticas por WhatsApp

Esta guía te ayudará a configurar las notificaciones automáticas para que recibas un mensaje en tu WhatsApp todos los días (8:00 AM) con las cuentas que vencen hoy, vencen mañana o ya están vencidas.

## 1. Obtener Credenciales de Firebase (Service Account)

Para que el script pueda leer las ventas automáticamente sin que tú abras la página, necesita conectarse a la base de datos (Firestore) usando un "Service Account".

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/).
2. Selecciona tu proyecto (`streaming-d0fac`).
3. En el menú lateral izquierdo, haz clic en el ícono de engranaje (⚙️) junto a "Project Overview" (Descripción general del proyecto) y selecciona **Configuración del proyecto (Project settings)**.
4. Ve a la pestaña **Cuentas de servicio (Service accounts)**.
5. Haz clic en el botón azul **Generar nueva clave privada (Generate new private key)** y luego en **Generar clave**.
6. Se descargará un archivo `.json` en tu computadora. Ábrelo con un bloc de notas o cualquier editor de texto y **copia todo el contenido del archivo**.

## 2. Obtener el API Key de CallMeBot

Usaremos CallMeBot para enviarte el mensaje de WhatsApp de forma gratuita a tu propio número.

1. Añade el número de teléfono `+34 691 62 17 28` (o el que te indique la web oficial de [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/)) a los contactos de tu celular.
2. Envíale el siguiente mensaje por WhatsApp a ese número:
   `I allow callmebot to send me messages`
3. El bot te responderá inmediatamente con tu **API Key**. ¡Guárdalo!

## 3. Configurar los Secrets en GitHub

Ahora, debemos darle estas credenciales a GitHub Actions para que el script pueda ejecutarse a diario de forma segura (sin exponer tus claves en el código público).

1. Ve a tu repositorio de GitHub donde tienes este código alojado.
2. En la parte superior, haz clic en la pestaña **Settings (Configuración)**.
3. En el menú lateral izquierdo, baja hasta **Secrets and variables** y haz clic en **Actions**.
4. Haz clic en el botón verde **New repository secret**.

Vas a crear **3 secretos** en total. Para cada uno, pon el nombre en el campo *Name* y su valor en el campo *Secret*, luego haz clic en *Add secret*:

### Secreto 1:
- **Name:** `FIREBASE_SERVICE_ACCOUNT`
- **Secret:** *(Pega aquí TODO el texto del archivo .json que descargaste de Firebase en el Paso 1)*

### Secreto 2:
- **Name:** `CALLMEBOT_PHONE`
- **Secret:** *(Escribe tu número de teléfono de WhatsApp con el código de país. Ej. Si eres de Perú, sería `+519XXXXXXX`)*

### Secreto 3:
- **Name:** `CALLMEBOT_API_KEY`
- **Secret:** *(Pega aquí la clave o número que te respondió el bot en el Paso 2)*

---

## ¡Todo listo!

Una vez configurados los secretos en GitHub:

- El sistema revisará automáticamente las fechas todos los días a las **8:00 AM** (Hora de Perú).
- Si hay cuentas que están vencidas, vencen hoy o mañana, recibirás un mensaje de WhatsApp.
- También puedes probar que funciona en cualquier momento yendo a la pestaña **Actions** en GitHub, seleccionando "WhatsApp Daily Notifier" en la izquierda, haciendo clic en "Run workflow" en la derecha y confirmando el botón verde.
