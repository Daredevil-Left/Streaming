from playwright.sync_api import sync_playwright
import os
import datetime
import time

# Calculate dates
today = datetime.date.today()
yesterday = today - datetime.timedelta(days=1)
tomorrow = today + datetime.timedelta(days=1)
day_plus_2 = today + datetime.timedelta(days=2)
day_plus_3 = today + datetime.timedelta(days=3)

def test_alerts():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"JS Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"JS Error: {err}"))

        # Mock firebase-config.js
        page.route("**/firebase-config.js", lambda route: route.fulfill(
            status=200,
            content_type="application/javascript",
            body='export const db = {}; export const auth = {};'
        ))

        # Mock firebase-auth.js
        page.route("**/firebase-auth.js", lambda route: route.fulfill(
            status=200,
            content_type="application/javascript",
            body='export const onAuthStateChanged = (auth, cb) => cb({email: "renzosamanamud@gmail.com"}); export const signOut = () => {};'
        ))

        # Mock app-check
        page.route("**/firebase-app-check.js", lambda route: route.fulfill(
            status=200,
            content_type="application/javascript",
            body='export const initializeAppCheck = () => {}; export const ReCaptchaV3Provider = class {};'
        ))

        # Mock firebase-app.js
        page.route("**/firebase-app.js", lambda route: route.fulfill(
            status=200,
            content_type="application/javascript",
            body='export const initializeApp = () => {};'
        ))


        # Mock firebase-firestore.js
        mock_firestore_js = f"""
        export const collection = (db, name) => ({{ type: 'collection', name }});
        export const doc = () => ({{}});
        export const addDoc = () => Promise.resolve({{id: '123'}});
        export const updateDoc = () => Promise.resolve();
        export const deleteDoc = () => Promise.resolve();
        export const getDocs = () => Promise.resolve({{empty: true, docs: []}});
        export const getDoc = () => Promise.resolve({{exists: () => false}});
        export const setDoc = () => Promise.resolve();
        export const deleteField = () => {{}};

        export const onSnapshot = (ref, callback) => {{
            setTimeout(() => {{
                if (ref.name === 'sales') {{
                    const docs = [
                        {{ id: '1', data: () => ({{ cliente: 'Client Today', finPlan: '{today}', estado: 'ACTIVO', plataforma: 'Netflix', precio: 10 }}) }},
                        {{ id: '2', data: () => ({{ cliente: 'Client Tomorrow', finPlan: '{tomorrow}', estado: 'ACTIVO', plataforma: 'Netflix', precio: 10 }}) }},
                        {{ id: '3', data: () => ({{ cliente: 'Client Plus 2', finPlan: '{day_plus_2}', estado: 'ACTIVO', plataforma: 'Netflix', precio: 10 }}) }},
                        {{ id: '4', data: () => ({{ cliente: 'Client Plus 3', finPlan: '{day_plus_3}', estado: 'ACTIVO', plataforma: 'Netflix', precio: 10 }}) }},
                        {{ id: '5', data: () => ({{ cliente: 'Client Yesterday', finPlan: '{yesterday}', estado: 'ACTIVO', plataforma: 'Netflix', precio: 10 }}) }},
                        {{ id: '6', data: () => ({{ cliente: 'Client Maint', finPlan: '{today}', estado: 'EN_MANTENIMIENTO', plataforma: 'Netflix', precio: 10 }}) }},
                    ];
                    callback({{ docs }});
                }} else if (ref.name === 'platformAccounts') {{
                    const docs = [
                        {{ id: 'A', data: () => ({{ email: 'Account Today', fechaPago: '{today}', platform: 'Netflix' }}) }},
                        {{ id: 'B', data: () => ({{ email: 'Account Plus 2', fechaPago: '{day_plus_2}', platform: 'Netflix' }}) }},
                        {{ id: 'C', data: () => ({{ email: 'Account Plus 3', fechaPago: '{day_plus_3}', platform: 'Netflix' }}) }},
                        {{ id: 'D', data: () => ({{ email: 'Account Yesterday', fechaPago: '{yesterday}', platform: 'Netflix' }}) }},
                    ];
                    callback({{ docs }});
                }} else if (ref.name === 'expenses') {{
                     callback({{ docs: [] }});
                }} else if (ref.name === 'config') {{
                     callback({{ exists: false }});
                }}
            }}, 100);
            return () => {{}};
        }};
        """
        page.route("**/firebase-firestore.js", lambda route: route.fulfill(
            status=200,
            content_type="application/javascript",
            body=mock_firestore_js
        ))

        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # Wait for dashboard to load
        page.wait_for_selector("#kpi-sales-today:not(.skeleton)")
        time.sleep(2)

        page.screenshot(path="verification/alerts_verification.png", full_page=True)

        # Scoped assertions
        sales_alerts = page.locator("#alerts-section").inner_text()
        account_alerts = page.locator("#platform-account-alerts-section").inner_text()

        print("Checking assertions...")

        # Sales
        if "Client Today" not in sales_alerts: print("FAIL: Client Today missing in alerts")
        if "Client Tomorrow" not in sales_alerts: print("FAIL: Client Tomorrow missing in alerts")
        if "Client Plus 2" not in sales_alerts: print("FAIL: Client Plus 2 missing in alerts")
        if "Client Plus 3" in sales_alerts: print("FAIL: Client Plus 3 present in alerts")
        if "Client Yesterday" in sales_alerts: print("FAIL: Client Yesterday present in alerts")
        if "Client Maint" in sales_alerts: print("FAIL: Client Maint present in alerts")

        # Accounts
        if "Account Today" not in account_alerts: print("FAIL: Account Today missing in alerts")
        if "Account Plus 2" not in account_alerts: print("FAIL: Account Plus 2 missing in alerts")
        if "Account Plus 3" in account_alerts: print("FAIL: Account Plus 3 present in alerts")
        if "Account Yesterday" in account_alerts: print("FAIL: Account Yesterday present in alerts")

        assert "Client Today" in sales_alerts
        assert "Client Tomorrow" in sales_alerts
        assert "Client Plus 2" in sales_alerts
        assert "Client Plus 3" not in sales_alerts
        assert "Client Yesterday" not in sales_alerts
        assert "Client Maint" not in sales_alerts

        assert "Account Today" in account_alerts
        assert "Account Plus 2" in account_alerts
        assert "Account Plus 3" not in account_alerts
        assert "Account Yesterday" not in account_alerts

        print("Verification passed!")

if __name__ == "__main__":
    test_alerts()
