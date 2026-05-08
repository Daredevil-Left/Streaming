from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("file:///app/index.html")

        # By default it's hidden so we manually unhide
        page.evaluate("document.getElementById('app').classList.remove('hidden')")

        # Navigate to cuentas view
        page.evaluate("document.getElementById('nav-cuentas').click()")

        # Make the form visible explicitly to bypass transition
        page.evaluate("document.getElementById('collapsible-accounts-content').classList.remove('hidden')")

        # Manually invoke the combo logic directly
        page.evaluate("document.getElementById('single-account-platform-container').classList.add('hidden')")
        page.evaluate("document.getElementById('combo-platforms-container').classList.remove('hidden')")

        # wait a bit for css
        time.sleep(1)

        page.screenshot(path="verification/combo_test4.png", full_page=True)
        browser.close()

run()
