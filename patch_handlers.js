const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const newFunctions = `
            const generateNewPin = (platform) => {
                const isAmazon = (platform && platform.toLowerCase().includes('amazon'));
                const length = isAmazon ? 5 : 4;
                let pin = '';
                for (let i = 0; i < length; i++) {
                    pin += Math.floor(Math.random() * 10).toString();
                }
                return pin;
            };

            const showPinChangeAlertModal = (saleData, profileData, accountData, oldPin, newPin, isShared) => {
                const modal = selectors.pinChangeAlertModal;

                document.getElementById('pin-alert-client').textContent = saleData.cliente || 'Desconocido';
                document.getElementById('pin-alert-profile').textContent = profileData ? profileData.nombre : 'Desconocido';

                document.getElementById('pin-alert-email').textContent = accountData ? accountData.email : 'N/A';
                document.getElementById('pin-alert-password').textContent = accountData ? accountData.password : 'N/A';

                document.getElementById('pin-alert-old-pin').textContent = oldPin || 'Ninguno';
                document.getElementById('pin-alert-new-pin').textContent = newPin;

                const warningEl = document.getElementById('pin-alert-crunchy-warning');
                if (isShared) {
                    warningEl.classList.remove('hidden');
                } else {
                    warningEl.classList.add('hidden');
                }

                modal.classList.remove('hidden');
                setTimeout(() => {
                    modal.classList.remove('opacity-0');
                    modal.querySelector('.modal-content').classList.remove('scale-95');
                }, 10);
            };

            const closePinChangeAlertModal = () => {
                const modal = selectors.pinChangeAlertModal;
                modal.classList.add('opacity-0');
                modal.querySelector('.modal-content').classList.add('scale-95');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
            };
`;

html = html.replace('const handleArchiveAction = async (id) => {', newFunctions + '\n            const handleArchiveAction = async (id) => {');

// Add listener
html = html.replace("selectors.closeMaintenanceModalBtn.addEventListener('click', toggleMaintenanceModal);", "selectors.closeMaintenanceModalBtn.addEventListener('click', toggleMaintenanceModal);\n        selectors.closePinAlertBtn.addEventListener('click', closePinChangeAlertModal);");

fs.writeFileSync('index.html', html);
