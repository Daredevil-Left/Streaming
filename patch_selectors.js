// Read the file and add selectors for the new PIN modal
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace("editSaleStatus: document.getElementById('edit-sale-status')",
  "pinChangeAlertModal: document.getElementById('pin-change-alert-modal'),\n                closePinAlertBtn: document.getElementById('close-pin-alert-btn'),\n                editSaleStatus: document.getElementById('edit-sale-status')");

fs.writeFileSync('index.html', html);
