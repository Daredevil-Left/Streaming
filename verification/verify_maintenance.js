const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Mock Firebase Auth
  await page.route('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        export const onAuthStateChanged = (auth, callback) => {
            setTimeout(() => callback({ email: 'renzosamanamud@gmail.com' }), 0);
        };
        export const signOut = async () => {};
      `
    });
  });

  // Mock Firebase Firestore
  await page.route('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        export const collection = () => ({ type: 'collection' });
        export const addDoc = async () => {};
        export const onSnapshot = (ref, callback) => {
             if (ref && ref.type === 'document') {
                 callback({
                     exists: () => false,
                     data: () => ({})
                 });
             } else {
                 callback({
                    docs: [
                        {
                            id: '2',
                            data: () => ({
                                cliente: null, // Null client
                                plataforma: 'Netflix',
                                precio: 10,
                                inicioPlan: '2023-01-01',
                                finPlan: '2023-02-01',
                                estado: 'EN_MANTENIMIENTO',
                            })
                        }
                    ],
                    empty: false
                 });
             }
             return () => {};
        };
        export const doc = () => ({ type: 'document' });
        export const updateDoc = async () => {};
        export const deleteDoc = async () => {};
        export const getDocs = async () => ({ docs: [], empty: true });
        export const setDoc = async () => {};
        export const getDoc = async () => ({ exists: () => false, data: () => ({}) });
        export const deleteField = () => {};
      `
    });
  });

  // Mock local firebase-config.js
  await page.route('**/firebase-config.js', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        export const db = {};
        export const auth = {};
      `
    });
  });

  const filePath = 'file://' + path.resolve(__dirname, '../index.html');
  console.log(`Navigating to ${filePath}`);
  await page.goto(filePath);

  // Wait for app to be visible
  await page.waitForSelector('#app');

  // Navigate to Ventas
  await page.click('#nav-ventas');
  await page.waitForSelector('#ventas-view:not(.hidden)');

  // Click Mantenimiento button
  await page.click('#view-maintenance-btn');

  // Wait for modal
  const modal = await page.waitForSelector('#maintenance-modal:not(.hidden)');

  // Take screenshot
  const screenshotPath = path.join(__dirname, 'verification.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to ${screenshotPath}`);

  await browser.close();
})();
