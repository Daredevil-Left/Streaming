
import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Read the content of the HTML file
        with open('index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()

        # Set the content of the page, bypassing navigation
        await page.set_content(html_content, wait_until='load')

        # Since auth is now active, we need to bypass the redirect again inside the page context
        await page.evaluate('''() => {
            const app = document.getElementById('app');
            if (app.classList.contains('hidden')) {
                app.classList.remove('hidden');
            }
        }''')

        # Now, explicitly show the 'Cuentas' view
        await page.evaluate('''() => {
            document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
            document.getElementById('cuentas-view').classList.remove('hidden');
            document.getElementById('main-header').textContent = 'Cuentas';
        }''')

        # Wait for mother accounts to be rendered by Firebase
        await page.wait_for_selector('.mother-account-header', timeout=10000)

        # Click the first mother account header to expand it
        await page.click('div.mother-account-header')

        # Wait for the profiles container to be visible and loaded
        await page.wait_for_selector('.profiles-container:not(.hidden)', timeout=5000)

        # Click the menu button on the first mother account
        await page.click('.mother-account-header:first-child .menu-btn')
        await page.wait_for_selector('.menu-dropdown:not(.hidden)')

        # Click the edit button
        await page.click('.edit-mother-account-menu-btn')
        await page.wait_for_selector('#edit-mother-account-modal:not(.hidden)')

        # Take a screenshot
        screenshot_path = 'final_verification.png'
        await page.screenshot(path=screenshot_path)

        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
