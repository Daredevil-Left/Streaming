const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('const showPinChangeAlertModal = ', 'window.showPinChangeAlertModal = ');
fs.writeFileSync('index.html', html);
