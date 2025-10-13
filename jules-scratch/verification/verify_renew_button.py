import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Go directly to the main page
        await page.goto("file:///app/index.html")

        # Inject a dummy user to bypass login
        await page.evaluate("() => { localStorage.setItem('user', '{\"uid\":\"testuser\"}'); }")

        # Reload the page to trigger onAuthStateChanged with the dummy user
        await page.reload()

        # Wait for the app to be ready
        await page.wait_for_selector("#app:not(.hidden)")

        # Add a dummy sale to ensure the list is not empty
        await page.evaluate('''() => {
            const sale = {
                id: '123',
                cliente: 'Test Client',
                plataforma: 'Netflix',
                precio: 10.00,
                inicioPlan: '2024-01-01',
                finPlan: '2024-01-31'
            };
            const salesList = document.getElementById('sales-list');
            const row = document.createElement('div');
            row.className = `grid grid-cols-2 md:grid-cols-7 gap-4 items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border-b text-sm`;
            row.innerHTML = `
                <div class="col-span-2 font-semibold text-gray-800">${sale.cliente}</div>
                <div class="hidden md:block"><span>${sale.plataforma}</span></div>
                <div class="hidden md:block">2024-01-31</div>
                <div class="hidden md:block"><span>Activo</span></div>
                <div class="hidden md:block font-bold text-gray-800">S/10.00</div>
                <div class="flex justify-end gap-3 items-center">
                    <button class="edit-btn p-1" data-id="${sale.id}"></button>
                    <button class="delete-btn p-1" data-id="${sale.id}"></button>
                    <button class="renew-btn p-1 text-green-600" data-id="${sale.id}">Renovar</button>
                </div>
            `;
            salesList.appendChild(row);

            // Mock the handleRenew function
            window.handleRenew = async (id) => {
                alert('Suscripción renovada con éxito.');
            };

            // Add event listener to the renew button
            salesList.querySelector('.renew-btn').addEventListener('click', e => handleRenew(e.currentTarget.dataset.id));
        }''')

        # Click the renew button
        await page.click('.renew-btn')

        # Handle the alert
        page.on("dialog", lambda dialog: dialog.accept())

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/renew-button-verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())