
from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Mock Firebase Config
    page.route('**/firebase-config.js', lambda route: route.fulfill(
        status=200,
        content_type='application/javascript',
        body="""
        export const db = {};
        export const auth = {};
        """
    ))

    # Mock Firebase Firestore
    page.route('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js', lambda route: route.fulfill(
        status=200,
        content_type='application/javascript',
        body="""
        export const collection = () => {};
        export const addDoc = () => Promise.resolve({ id: 'test-id' });
        export const onSnapshot = (ref, callback) => {
            callback({ docs: [] });
            return () => {};
        };
        export const doc = () => {};
        export const updateDoc = () => Promise.resolve();
        export const deleteDoc = () => Promise.resolve();
        export const getDocs = () => Promise.resolve({ docs: [] });
        export const setDoc = () => Promise.resolve();
        export const getDoc = () => Promise.resolve({ exists: () => false });
        """
    ))

    # Mock Firebase Auth
    page.route('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js', lambda route: route.fulfill(
        status=200,
        content_type='application/javascript',
        body="""
        export const onAuthStateChanged = (auth, callback) => {
             setTimeout(() => callback({ uid: 'test-user' }), 100);
             return () => {};
        };
        export const signOut = () => Promise.resolve();
        """
    ))

    # Navigate to index.html
    file_path = os.path.abspath('index.html')
    page.goto(f'file://{file_path}')

    # Wait for app load
    try:
        page.wait_for_selector('#app:not(.hidden)', timeout=5000)
        print('App loaded.')
    except:
        print('Timeout waiting for app. Checking visibility manually.')

    # Go to Precios view
    page.click('#nav-precios')
    page.wait_for_selector('#precios-view:not(.hidden)')

    # Scenario: Netflix + Disney (3 Months)
    # Duration: 3 months
    page.evaluate('window.setDuration(3)')
    # Services: Netflix (already selected?), toggle Netflix (if not selected)
    # Actually logic resets selectedServices? No, let's assume fresh start.
    # Let's ensure Netflix is selected.
    # The UI rendering might reset state or default.
    # Let's just toggle Netflix and Disney.
    page.evaluate("window.toggleService('netflix')") # Selects Netflix
    page.evaluate("window.toggleService('disney')")  # Selects Disney

    # Wait for UI update (optional, but good practice)
    page.wait_for_timeout(500)

    # Screenshot of the pricing area
    element = page.locator('#precios-view')
    element.screenshot(path='verification/pricing_screenshot.png')
    print('Screenshot saved to verification/pricing_screenshot.png')

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
