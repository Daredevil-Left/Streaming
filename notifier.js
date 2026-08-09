const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
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

    initializeApp({
      credential: cert(serviceAccount)
    });

    const db = getFirestore();

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

      // Correctly parse the date directly into the target timezone to prevent UTC shift offsets
      const finPlanDate = dayjs.tz(sale.finPlan, 'America/Lima').startOf('day');
      const diffDays = finPlanDate.diff(today, 'day');

      // We want to alert ONLY for upcoming expirations to avoid exceeding Telegram's 4096 character limit
      // - diffDays === 1 (expires tomorrow)
      // - diffDays === 0 (expires today)

      if (diffDays === 0 || diffDays === 1) {
        let statusText = '';
        if (diffDays === 0) {
          statusText = '🟠 VENCE HOY';
        } else if (diffDays === 1) {
          statusText = '🟡 VENCE MAÑANA';
        }

        expiringSales.push({
          id: doc.id,
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

    // 4. Send Individual Telegram Messages (Using HTML to avoid markdown parsing errors)
    // Function to safely escape HTML special characters
    const escapeHTML = (str) => {
      if (!str) return '';
      return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    };

    const apiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    console.log(`Sending ${expiringSales.length} individual Telegram messages...`);

    for (let i = 0; i < expiringSales.length; i++) {
      const s = expiringSales[i];
      let message = `<b>🔔 ALERTA DE VENCIMIENTO</b>\n`;
      message += `Fecha: ${today.format('DD/MM/YYYY')}\n\n`;
      message += `<b>${s.statusText}</b>\n`;
      message += `👤 Cliente: ${escapeHTML(s.cliente)}\n`;
      message += `📺 Plataforma: ${escapeHTML(s.plataforma)}\n`;
      message += `📅 Fin del plan: ${dayjs(s.finPlan).format('DD/MM/YYYY')}\n\n`;

      message += `Para poder renovar puede yapear al siguiente número:\n`;
      message += `📱 YAPE: 933622323\n`;
      message += `👤 Nombre: Chartisa P.`;

      try {
        const response = await axios.post(apiUrl, {
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🔄 Renovar 1 mes',
                  callback_data: `renew_${s.id}`
                }
              ]
            ]
          }
        });

        if (response.status === 200) {
          console.log(`Message sent successfully for client: ${s.cliente}`);
        } else {
          console.error(`Failed to send message for ${s.cliente}. Status: ${response.status}`);
        }
      } catch (err) {
        console.error(`Error sending message for ${s.cliente}:`, err.message);
        if (err.response && err.response.data) {
           console.error("Telegram API Error Details:", err.response.data);
        }
      }

      // Add a small delay between requests to avoid hitting Telegram rate limits (approx 30 msgs/sec limit)
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log("Finished sending all notifications.");

  } catch (error) {
    console.error("Error running notifier script:", error.message);
    if (error.response && error.response.data) {
       console.error("Telegram API Error Details:", error.response.data);
    }
    process.exit(1);
  }
}

run();
