from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Load via HTTP server
        page.goto('http://localhost:8000/jules-scratch/index_test.html')

        # Wait for alerts to render
        page.wait_for_selector('#alerts-section > div', timeout=5000)
        page.wait_for_selector('#platform-account-alerts-section > div', timeout=5000)

        page.screenshot(path='verification/dashboard_alerts.png', full_page=True)

        # Check text content of alert containers specifically
        alerts_text = page.locator('#alerts-section').inner_text()
        account_alerts_text = page.locator('#platform-account-alerts-section').inner_text()

        print('--- Sales Alerts Content ---')
        print(alerts_text)
        print('----------------------------')

        print('--- Account Alerts Content ---')
        print(account_alerts_text)
        print('------------------------------')

        # Logic checks
        if 'Expired' in alerts_text and 'In 2 Days' in alerts_text:
             print('✅ Sales range seems correct (Expired to In 2 Days)')
        else:
             print('❌ Sales range missing items')

        if 'In 3 Days' not in alerts_text:
             print('✅ Sales correctly excludes In 3 Days')
        else:
             print('❌ Sales incorrectly includes In 3 Days')

        if 'expired@test.com' in account_alerts_text and 'in2days@test.com' in account_alerts_text:
             print('✅ Accounts range seems correct')
        else:
             print('❌ Accounts range missing items')

        if 'in3days@test.com' not in account_alerts_text:
             print('✅ Accounts correctly excludes In 3 Days')
        else:
             print('❌ Accounts incorrectly includes In 3 Days')

        browser.close()

if __name__ == '__main__':
    run()
