from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the HTML file
        index_file_path = os.path.abspath('index.html')

        # Go to the local HTML file
        page.goto(f'file://{index_file_path}')

        # Wait for the app to be ready (attached, not necessarily visible)
        page.wait_for_selector('#app', state='attached')

        # Remove the hidden class to make the app visible
        page.evaluate("document.getElementById('app').classList.remove('hidden')")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run()