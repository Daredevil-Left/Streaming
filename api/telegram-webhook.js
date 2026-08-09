const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Set up DayJS timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('America/Lima');

// Initialize Firebase Admin only once
if (!getApps().length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
  }
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({
    credential: cert(serviceAccount)
  });
}
const db = getFirestore();

// Helper to escape HTML characters
const escapeHTML = (str) => {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

// Send a message back to Telegram
async function sendTelegramMessage(chatId, text, replyToMessageId = null) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };
  if (replyToMessageId) {
    payload.reply_to_message_id = replyToMessageId;
  }
  await axios.post(url, payload);
}

// Answer Callback Query (removes loading state from button)
async function answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
  await axios.post(url, {
    callback_query_id: callbackQueryId,
    text: text,
    show_alert: showAlert
  });
}

// Edit Message Text
async function editMessageText(chatId, messageId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/editMessageText`;
  await axios.post(url, {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [] } // Remove buttons
  });
}

// Serverless Handler
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).send('Missing TELEGRAM_BOT_TOKEN');
  }

  const update = req.body;

  try {
    // 1. Handle regular text messages (commands)
    if (update.message && update.message.text) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id;

      // Handle /buscar command
      if (text.toLowerCase().startsWith('/buscar ')) {
        const query = text.substring(8).trim().toLowerCase();

        if (!query) {
          await sendTelegramMessage(chatId, '⚠️ Debes escribir un nombre. Ejemplo: `/buscar Juan`');
          return res.status(200).send('OK');
        }

        const salesSnapshot = await db.collection('sales').get();
        const results = [];

        salesSnapshot.forEach(doc => {
          const data = doc.data();
          const cliente = (data.cliente || '').toLowerCase();

          if (cliente.includes(query) && data.estado !== 'EN_MANTENIMIENTO') {
            results.push(data);
          }
        });

        if (results.length === 0) {
          await sendTelegramMessage(chatId, `❌ No se encontraron ventas activas para: <b>${escapeHTML(query)}</b>`);
          return res.status(200).send('OK');
        }

        for (const sale of results) {
          let msg = `👤 <b>Cliente:</b> ${escapeHTML(sale.cliente)}\n`;
          msg += `📺 <b>Plataforma:</b> ${escapeHTML(sale.plataforma)}\n`;
          msg += `📅 <b>Fin del Plan:</b> ${sale.finPlan ? dayjs(sale.finPlan).format('DD/MM/YYYY') : 'N/A'}\n\n`;

          // Use <code> for easy tap-to-copy
          if (sale.correo) msg += `✉️ <b>Correo:</b> <code>${escapeHTML(sale.correo)}</code>\n`;
          if (sale.contrasena) msg += `🔑 <b>Contraseña:</b> <code>${escapeHTML(sale.contrasena)}</code>\n`;
          if (sale.perfil) msg += `👥 <b>Perfil:</b> <code>${escapeHTML(sale.perfil)}</code>\n`;
          if (sale.pin) msg += `🔢 <b>PIN:</b> <code>${escapeHTML(sale.pin)}</code>\n`;

          await sendTelegramMessage(chatId, msg);
        }
      }
    }

    // 2. Handle button clicks (Callback Queries)
    else if (update.callback_query) {
      const callbackData = update.callback_query.data; // e.g., 'renew_ID'
      const chatId = update.callback_query.message.chat.id;
      const messageId = update.callback_query.message.message_id;
      const callbackQueryId = update.callback_query.id;

      if (callbackData.startsWith('renew_')) {
        const saleId = callbackData.split('_')[1];
        const docRef = db.collection('sales').doc(saleId);

        const doc = await docRef.get();

        if (!doc.exists) {
          await answerCallbackQuery(callbackQueryId, '❌ La venta ya no existe.', true);
          return res.status(200).send('OK');
        }

        const sale = doc.data();
        if (!sale.finPlan) {
          await answerCallbackQuery(callbackQueryId, '❌ La venta no tiene fecha de fin.', true);
          return res.status(200).send('OK');
        }

        // Add 30 days to the current finPlan
        const currentFinPlan = dayjs.tz(sale.finPlan, 'America/Lima');
        const newFinPlan = currentFinPlan.add(30, 'day').format('YYYY-MM-DD');

        // Update in Firestore
        await docRef.update({ finPlan: newFinPlan });

        // Acknowledge the click
        await answerCallbackQuery(callbackQueryId, '✅ Venta renovada por 30 días.');

        // Edit the message to show it's updated
        let updatedMsg = `<b>✅ RENOVACIÓN COMPLETADA</b>\n\n`;
        updatedMsg += `👤 Cliente: ${escapeHTML(sale.cliente)}\n`;
        updatedMsg += `📺 Plataforma: ${escapeHTML(sale.plataforma)}\n`;
        updatedMsg += `📅 <b>Nuevo Fin de Plan:</b> ${dayjs(newFinPlan).format('DD/MM/YYYY')}`;

        await editMessageText(chatId, messageId, updatedMsg);
      }
    }

  } catch (error) {
    console.error("Webhook Error:", error);
  }

  // Always return 200 OK so Telegram doesn't retry
  res.status(200).send('OK');
};
