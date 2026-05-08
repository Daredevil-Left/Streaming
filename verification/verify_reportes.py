from playwright.sync_api import sync_playwright

def test_reportes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant clipboard permissions
        context = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
        page = context.new_page()

        # Catch console logs to debug
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser error: {err}"))

        print("Navigating to page...")
        page.goto("http://localhost:8000/index.html?loggedin=true")

        # Wait for the app to load
        page.wait_for_selector("#nav-dashboard", timeout=10000)

        # Click Reportes nav link
        print("Clicking Reportes nav link...")
        page.click("#nav-reportes")

        # Wait for the Reportes view to be visible
        page.wait_for_selector("#reportes-view:not(.hidden)", timeout=5000)

        page.wait_for_timeout(2000)

        page.screenshot(path="verification/reportes_view.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    test_reportes()
