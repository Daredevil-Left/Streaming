from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("file:///app/index.html")

        # By default it's hidden so we manually unhide
        page.evaluate("document.getElementById('app').classList.remove('hidden')")

        # Click the add account toggle to show the forms
        page.evaluate("document.getElementById('toggle-add-account-btn').click()")

        # Select the combo checkbox
        page.evaluate("document.getElementById('is-combo-checkbox').click()")

        # wait a bit for css
        time.sleep(1)

        page.screenshot(path="verification/combo_test.png", full_page=True)
        browser.close()

run()
