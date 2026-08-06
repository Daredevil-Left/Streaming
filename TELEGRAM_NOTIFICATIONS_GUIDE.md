# Guía de Configuración de Notificaciones Automáticas por Telegram

Esta guía te ayudará a configurar las notificaciones automáticas para que recibas un mensaje en tu Telegram todos los días (8:00 AM) con las cuentas que vencen hoy, vencen mañana o ya están vencidas.

## 1. Obtener Credenciales de Firebase (Service Account)

Para que el script pueda leer las ventas automáticamente sin que tú abras la página, necesita conectarse a la base de datos (Firestore) usando un "Service Account".

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/).
2. Selecciona tu proyecto (`streaming-d0fac`).
3. En el menú lateral izquierdo, haz clic en el ícono de engranaje (⚙️) junto a "Project Overview" (Descripción general del proyecto) y selecciona **Configuración del proyecto (Project settings)**.
4. Ve a la pestaña **Cuentas de servicio (Service accounts)**.
5. Haz clic en el botón azul **Generar nueva clave privada (Generate new private key)** y luego en **Generar clave**.
6. Se descargará un archivo `.json` en tu computadora. Ábrelo con un bloc de notas o cualquier editor de texto y **copia todo el contenido del archivo**.

## 2. Crear un Bot de Telegram y Obtener Credenciales

Vamos a crear un bot gratuito y oficial en Telegram que será el encargado de enviarte los mensajes a ti.

1. Abre Telegram y busca al usuario **@BotFather** (tiene un check azul verificado).
2. Envíale el mensaje `/newbot`.
3. Te pedirá un nombre para tu bot (ej. `Notificador de Ventas`).
4. Te pedirá un nombre de usuario para tu bot. Debe terminar en "bot" (ej. `midashboard_notificador_bot`).
5. @BotFather te responderá con un mensaje de éxito que incluye tu **Token (API Token)**. Copia ese texto largo que se ve parecido a `123456789:ABCdefGHIjklmNOPQrsTUVwxyz`.
6. Haz clic en el enlace (nombre de usuario) de tu nuevo bot en ese mismo mensaje para abrir un chat con él y presiona el botón **Iniciar** (o envíale `/start`).
7. Ahora necesitamos obtener tu **Chat ID**. Para eso, reenvía un mensaje tuyo a tu bot o simplemente escríbele algo. Luego entra en tu navegador web a este enlace, reemplazando `<TOKEN>` por el token que te dio BotFather en el paso 5:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
8. Te mostrará un texto con código. Busca donde diga `"chat":{"id": 123456789...`. Ese número (ej. `123456789`) es tu **Chat ID**. ¡Cópialo!

## 3. Configurar los Secrets en GitHub

Ahora debemos darle estas credenciales a GitHub Actions para que el script pueda ejecutarse a diario de forma segura (sin exponer tus claves en el código público).

1. Ve a tu repositorio de GitHub donde tienes este código alojado.
2. En la parte superior, haz clic en la pestaña **Settings (Configuración)**.
3. En el menú lateral izquierdo, baja hasta **Secrets and variables** y haz clic en **Actions**.
4. Haz clic en el botón verde **New repository secret**.

Vas a crear **3 secretos** en total. Para cada uno, pon el nombre en el campo *Name* y su valor en el campo *Secret*, luego haz clic en *Add secret*:

### Secreto 1:
- **Name:** `FIREBASE_SERVICE_ACCOUNT`
- **Secret:** *(Pega aquí TODO el texto del archivo .json que descargaste de Firebase en el Paso 1)*

### Secreto 2:
- **Name:** `TELEGRAM_BOT_TOKEN`
- **Secret:** *(Pega aquí el Token de la API que te dio @BotFather en el Paso 2)*

### Secreto 3:
- **Name:** `TELEGRAM_CHAT_ID`
- **Secret:** *(Pega aquí tu Chat ID numérico que conseguiste en el Paso 2)*

---

## ¡Todo listo!

Una vez configurados los secretos en GitHub:

- El sistema revisará automáticamente las fechas todos los días a las **8:00 AM** (Hora de Perú).
- Si hay cuentas que están vencidas, vencen hoy o mañana, recibirás un mensaje en Telegram a través del bot que creaste.
- También puedes probar que funciona en cualquier momento yendo a la pestaña **Actions** en GitHub, seleccionando "Telegram Daily Notifier" en la izquierda, haciendo clic en "Run workflow" en la derecha y confirmando el botón verde.
