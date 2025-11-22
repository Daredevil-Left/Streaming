import sys
import os
from playwright.sync_api import sync_playwright
import time
import threading
import http.server
import socketserver

# --- 1. Start a simple HTTP server ---
PORT = 8086
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    # Allow reuse address to prevent 'Address already in use' if we restart quickly
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(1) # Give it a sec to start

# --- 2. Define the Mock Firebase Module ---
mock_firebase_js = """
export const initializeApp = () => ({});
export const getFirestore = () => ({});
export const getAuth = () => ({});
export const collection = () => ({});
export const doc = () => ({});
export const addDoc = async () => ({ id: 'mock-id' });
export const updateDoc = async () => {};
export const deleteDoc = async () => {};
export const setDoc = async () => {};
export const getDoc = async () => ({
    exists: () => true,
    data: () => ({
        'netflix': { cost: 40, price: 12 },
        'disney': { cost: 20, price: 9 }
    })
});
export const getDocs = async () => ({
    empty: true,
    docs: []
});
export const onSnapshot = (query, callback) => {
    // Mock initial snapshot for sales, expenses, accounts
    callback({
        docs: []
    });
    return () => {}; // Unsubscribe function
};
export const onAuthStateChanged = (auth, callback) => {
    callback({ uid: 'test-user', email: 'test@example.com' }); // Simulate logged in
    return () => {};
};
export const signOut = async () => {};
export const initializeAppCheck = () => {};
export const ReCaptchaV3Provider = class {};
export const db = {};
export const auth = {};
"""

# --- 3. Run Playwright ---
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock the CDN imports
    page.route("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js", lambda route: route.fulfill(
        status=200,
        content_type="application/javascript",
        body=mock_firebase_js
    ))
    page.route("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js", lambda route: route.fulfill(
        status=200,
        content_type="application/javascript",
        body=mock_firebase_js
    ))

    # Mock the local config import
    page.route("**/firebase-config.js", lambda route: route.fulfill(
        status=200,
        content_type="application/javascript",
        body=mock_firebase_js
    ))

    # Navigate
    page.goto(f"http://localhost:{PORT}/index.html")

    # Wait for the app to load (dashboard hidden removed)
    page.wait_for_selector("#app:not(.hidden)")

    # Navigate to 'Precios' view
    page.click("#nav-precios")

    # Wait for view to be visible
    page.wait_for_selector("#precios-view:not(.hidden)")

    # Click 'Configurar Costos' button to show the panel
    page.click("#toggle-config-btn")

    # Wait for the config panel to appear
    page.wait_for_selector("#config-panel:not(.hidden)")

    # Take screenshot
    page.screenshot(path="after_changes.png")
    print("Screenshot saved to after_changes.png")

    browser.close()
