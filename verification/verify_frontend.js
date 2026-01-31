const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Mock firebase-config.js
  await page.route('**/firebase-config.js', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'export const db = {}; export const auth = {};'
    });
  });

  // Mock Firebase Auth
  await page.route('**/firebase-auth.js', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        export const onAuthStateChanged = (auth, cb) => {
          cb({ email: 'renzosamanamud@gmail.com' }); // Mock user
          return () => {};
        };
        export const signOut = () => Promise.resolve();
      `
    });
  });

  // Mock Firebase Firestore
  await page.route('**/firebase-firestore.js', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        export const collection = (db, name) => ({ type: 'collection', name });
        export const doc = (db, col, id) => ({ type: 'doc', path: col + '/' + id });
        export const getDoc = (ref) => {
            return Promise.resolve({
                exists: () => false,
                data: () => ({})
            });
        };
        export const setDoc = () => Promise.resolve();

        export const onSnapshot = (ref, cb) => {
          if (ref.type === 'collection') {
              if (ref.name === 'sales') {
                const today = new Date();
                const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
                const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
                const threeDays = new Date(today); threeDays.setDate(today.getDate() + 3);
                const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

                const formatDate = (d) => d.toISOString().split('T')[0];

                const docs = [
                  { id: '1', data: () => ({ cliente: 'Expiring Tomorrow', finPlan: formatDate(tomorrow), estado: 'ACTIVO', plataforma: 'Netflix', precio: 10 }) },
                  { id: '2', data: () => ({ cliente: 'Expiring Day After', finPlan: formatDate(dayAfter), estado: 'ACTIVO', plataforma: 'Disney+', precio: 10 }) },
                  { id: '3', data: () => ({ cliente: 'Expiring In 3 Days', finPlan: formatDate(threeDays), estado: 'ACTIVO', plataforma: 'HBO', precio: 10 }) },
                  { id: '4', data: () => ({ cliente: 'Expired Yesterday', finPlan: formatDate(yesterday), estado: 'ACTIVO', plataforma: 'Spotify', precio: 10 }) },
                ];
                cb({ docs });
              } else if (ref.name === 'platformAccounts') {
                 const today = new Date();
                 const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
                 const threeDays = new Date(today); threeDays.setDate(today.getDate() + 3);
                 const formatDate = (d) => d.toISOString().split('T')[0];

                 const docs = [
                    { id: 'a1', data: () => ({ email: 'acc_tomorrow@test.com', platform: 'Netflix', fechaPago: formatDate(tomorrow) }) },
                    { id: 'a2', data: () => ({ email: 'acc_3days@test.com', platform: 'HBO', fechaPago: formatDate(threeDays) }) }
                 ];
                 cb({ docs });
              } else {
                 cb({ docs: [] });
              }
          } else if (ref.type === 'doc') {
              cb({ exists: () => false, data: () => ({}) });
          }
          return () => {};
        };
        // Dummy exports for others
        export const addDoc = () => {};
        export const updateDoc = () => {};
        export const deleteDoc = () => {};
        export const getDocs = () => Promise.resolve({ empty: true, docs: [] });
        export const deleteField = () => {};
      `
    });
  });

  const filePath = 'file://' + path.resolve('index.html');
  console.log(`Navigating to ${filePath}`);
  await page.goto(filePath);

  try {
      await page.waitForSelector('#dashboard-view:not(.hidden)', { timeout: 10000 });
      console.log('Dashboard visible');
  } catch (e) {
      console.log('Timeout waiting for dashboard');
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/jules/verification/verification.png', fullPage: true });
  await browser.close();
})();
