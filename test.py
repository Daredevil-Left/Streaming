from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('file://' + __import__('os').path.abspath('index.html'))

    # Just a quick check to see if no syntax error was introduced
    errors = []
    page.on("pageerror", lambda e: errors.append(e))
    page.evaluate("1+1")
    browser.close()

    if errors:
        print("Syntax errors found:")
        for e in errors:
            print(e)
    else:
        print("No syntax errors.")
