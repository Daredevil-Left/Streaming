
import os
import sys
import threading
import http.server
import socketserver
from playwright.sync_api import sync_playwright

# Start a simple HTTP server
PORT = 8003
Handler = http.server.SimpleHTTPRequestHandler

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("serving at port", PORT)
        httpd.serve_forever()

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock Firebase Config
    page.route("**/firebase-config.js", lambda route: route.fulfill(
        status=200,
        content_type="application/javascript",
        body="export const db = {}; export const auth = {};"
    ))

    # Mock Firestore
    page.route("**/firebase-firestore.js", lambda route: route.fulfill(
        status=200,
        content_type="application/javascript",
        body="""
        export const collection = (db, name, ...args) => {
            return { _type: 'collection', _name: name };
        };

        export const doc = (db, col, id, ...args) => {
             return { _type: 'doc', _path: col + '/' + id };
        };

        export const addDoc = () => Promise.resolve({ id: 'test' });

        export const onSnapshot = (ref, callback) => {
            if (ref._type === 'collection' && ref._name === 'sales') {
                 setTimeout(() => {
                     callback({
                        docs: [
                            { id: '1', data: () => ({ cliente: 'Client A', estado: 'EN_MANTENIMIENTO', plataforma: 'Netflix', precio: 10 }) },
                            { id: '2', data: () => ({ cliente: null, estado: 'EN_MANTENIMIENTO', plataforma: 'Disney+', precio: 10 }) },
                            { id: '3', data: () => ({ cliente: 'Client B', estado: 'ACTIVO', plataforma: 'Netflix', precio: 10 }) }
                        ]
                    });
                 }, 100);
            } else if (ref._type === 'doc') {
                setTimeout(() => {
                    callback({
                        exists: () => true,
                        data: () => ({ order: [] })
                    });
                }, 100);
            } else {
                setTimeout(() => callback({ docs: [] }), 100);
            }
            return () => {};
        };

        export const updateDoc = () => Promise.resolve();
        export const deleteDoc = () => Promise.resolve();
        export const getDocs = () => Promise.resolve({ empty: true, docs: [], forEach: () => {} });
        export const setDoc = () => Promise.resolve();

        export const getDoc = (ref) => {
             if (ref._path && ref._path.startsWith('daily_closures/')) {
                 return Promise.resolve({ exists: () => true, data: () => ({ confirmed: true }) });
             }
             return Promise.resolve({ exists: () => false, data: () => ({}) });
        };
        export const deleteField = () => {};
        """
    ))

    # Mock Auth
    page.route("**/firebase-auth.js", lambda route: route.fulfill(
        status=200,
        content_type="application/javascript",
        body="""
        export const onAuthStateChanged = (auth, callback) => {
            callback({ email: 'test@example.com' });
            return () => {};
        };
        export const signOut = () => Promise.resolve();
        """
    ))

    page.goto(f"http://localhost:{PORT}/index.html")

    # Navigate to Ventas
    page.click("#nav-ventas")

    try:
        page.wait_for_selector("#platform-filters button", timeout=5000)
    except:
        pass

    if page.locator("#view-maintenance-btn").is_visible():
        page.click("#view-maintenance-btn")
        page.wait_for_selector("#maintenance-modal:not(.hidden)")

        if not os.path.exists("verification"):
            os.makedirs("verification")
        page.screenshot(path="verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
