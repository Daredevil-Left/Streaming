from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("file:///app/index.html")

        # By default it's hidden so we manually unhide
        page.evaluate("document.getElementById('app').classList.remove('hidden')")

        # Unhide reportes view
        page.evaluate("document.getElementById('reportes-view').classList.remove('hidden')")

        page.screenshot(path="verification/reportes_test.png")
        browser.close()

run()
