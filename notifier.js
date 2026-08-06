const admin = require('firebase-admin');
const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Set up DayJS timezone plugins to ensure date comparison consistency
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('America/Lima'); // Assuming Peru timezone based on YAPE info

async function run() {
  try {
    // 1. Initialize Firebase Admin
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();

    // 2. Setup Telegram credentials
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
      throw new Error("Missing Telegram credentials (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID).");
    }

    // 3. Fetch sales from Firestore
    console.log("Fetching sales from Firestore...");
    const salesSnapshot = await db.collection('sales').get();

    const expiringSales = [];
    const today = dayjs().tz('America/Lima').startOf('day');

    salesSnapshot.forEach(doc => {
      const sale = doc.data();

      // Skip sales without finPlan or if they are explicitly in maintenance
      if (!sale.finPlan || sale.estado === 'EN_MANTENIMIENTO') {
        return;
      }

      const finPlanDate = dayjs(sale.finPlan).tz('America/Lima').startOf('day');
      const diffDays = finPlanDate.diff(today, 'day');

      // We want to alert for:
      // - diffDays === 1 (expires tomorrow)
      // - diffDays === 0 (expires today)
      // - diffDays < 0 (already expired)

      if (diffDays <= 1) {
        let statusText = '';
        if (diffDays < 0) {
          statusText = '🔴 VENCIDO';
        } else if (diffDays === 0) {
          statusText = '🟠 VENCE HOY';
        } else if (diffDays === 1) {
          statusText = '🟡 VENCE MAÑANA';
        }

        expiringSales.push({
          cliente: sale.cliente || 'Desconocido',
          plataforma: sale.plataforma || 'Desconocida',
          finPlan: sale.finPlan,
          statusText: statusText,
          diffDays: diffDays
        });
      }
    });

    if (expiringSales.length === 0) {
      console.log("No sales are expiring soon. No message sent.");
      process.exit(0);
    }

    // Sort by diffDays ascending (most overdue first)
    expiringSales.sort((a, b) => a.diffDays - b.diffDays);

    // 4. Construct Telegram Message
    let message = `*🔔 ALERTAS DE VENCIMIENTO*\n`;
    message += `Fecha: ${today.format('DD/MM/YYYY')}\n\n`;

    expiringSales.forEach(s => {
      message += `${s.statusText}\n`;
      message += `👤 Cliente: ${s.cliente}\n`;
      message += `📺 Plataforma: ${s.plataforma}\n`;
      message += `📅 Fin del plan: ${dayjs(s.finPlan).format('DD/MM/YYYY')}\n`;
      message += `----------------------\n`;
    });

    message += `\n*Datos para renovaciones (Yape):*\n`;
    message += `📱 YAPE: 933622323\n`;
    message += `👤 Nombre: Chartisa P.`;

    console.log("Constructed message:");
    console.log(message);

    const apiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    console.log("Sending Telegram message...");
    const response = await axios.post(apiUrl, {
      chat_id: telegramChatId,
      text: message,
      parse_mode: 'Markdown'
    });

    if (response.status === 200) {
      console.log("Message sent successfully!");
    } else {
      console.error(`Failed to send message. Status: ${response.status}`, response.data);
    }

  } catch (error) {
    console.error("Error running notifier script:", error);
    process.exit(1);
  }
}

run();
