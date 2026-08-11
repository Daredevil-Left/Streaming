const { test, expect } = require('@playwright/test');
const path = require('path');

test('Mantenimiento button should open modal even with null client names', async ({ page }) => {
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
                            id: '1',
                            data: () => ({
                                cliente: 'Valid Client A',
                                plataforma: 'Netflix',
                                precio: 10,
                                inicioPlan: '2023-01-01',
                                finPlan: '2023-02-01',
                                estado: 'ACTIVO',
                                date: '2023-01-01', // for expenses
                                amount: 10, // for expenses
                                email: 'test@acc.com', // for accounts
                                platform: 'Netflix', // for accounts
                                nombre: 'Profile 1', // for profiles
                                profiles: [{id: 'p1', nombre: 'P1', estado: 'Disponible'}]
                            })
                        },
                        {
                            id: '2',
                            data: () => ({
                                cliente: null, // Potential crash cause
                                plataforma: 'Netflix',
                                precio: 10,
                                inicioPlan: '2023-01-01',
                                finPlan: '2023-02-01',
                                estado: 'EN_MANTENIMIENTO',
                            })
                        },
                        {
                            id: '3',
                            data: () => ({
                                cliente: 'Valid Client B',
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

  // Capture page errors
  const errors = [];
  page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
      errors.push(err);
  });

  const filePath = 'file://' + path.resolve(__dirname, '../index.html');
  await page.goto(filePath);

  // Wait for app to be visible
  await expect(page.locator('#app')).toBeVisible();

  // Navigate to Ventas
  await page.click('#nav-ventas');
  await expect(page.locator('#ventas-view')).toBeVisible();

  // Wait for Mantenimiento button
  const maintenanceBtn = page.locator('#view-maintenance-btn');
  await expect(maintenanceBtn).toBeVisible();

  // Click it
  await maintenanceBtn.click();

  // Check if modal opens
  const modal = page.locator('#maintenance-modal');

  // It should be visible (class 'hidden' removed)
  await expect(modal).not.toHaveClass(/hidden/);

  // Also check if opacity-0 is removed (animation)
  await expect(modal).not.toHaveClass(/opacity-0/);

  // Ensure no page errors occurred
  expect(errors).toHaveLength(0);
});
