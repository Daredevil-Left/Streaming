
import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Read the content of the HTML file
        with open('index.html', 'r') as f:
            html_content = f.read()

        # Set the content of the page
        await page.set_content(html_content, wait_until='load')

        # Simulate the app state
        await page.evaluate("""
            () => {
                document.getElementById('app').classList.remove('hidden');
                document.getElementById('dashboard-view').classList.add('hidden');
                document.getElementById('cuentas-view').classList.remove('hidden');

                // Make the collapsible content visible
                document.getElementById('collapsible-accounts-content').classList.remove('hidden');

                const accountsList = document.getElementById('accounts-list');
                accountsList.innerHTML = `
                    <div class="border border-gray-200 rounded-lg mb-3 overflow-hidden" data-account-id="test-account">
                        <div class="accordion-header cursor-pointer flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div class="flex items-center gap-4 flex-wrap">
                                <svg class="expand-icon w-6 h-6 transition-transform transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                <span class="font-semibold text-indigo-600">Netflix</span>
                                <span class="text-gray-700">test@example.com</span>
                                <span class="text-sm text-gray-500">Fecha de pago: 22 Oct 2025</span>
                            </div>
                        </div>
                        <div class="accordion-body hidden p-4 border-t border-gray-200 bg-white">
                            <div class="profiles-list space-y-2">
                                <div class="grid grid-cols-4 gap-4 items-center p-2 rounded-md hover:bg-gray-50">
                                    <div class="font-medium text-gray-800">Perfil 1</div>
                                    <div>
                                        <span class="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                        <span class="font-semibold text-xs py-1 px-2 uppercase rounded-full text-green-700 bg-green-100">Disponible</span>
                                    </div>
                                    <div class="pin-container flex items-center gap-2">
                                        <span class="pin-text font-mono text-gray-500">****</span>
                                        <button class="toggle-pin-btn text-gray-400 hover:text-gray-600" data-pin="1234">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                    </div>
                                    <div class="flex justify-end gap-2">
                                        <button class="edit-profile-btn p-1 text-indigo-600 hover:bg-indigo-100 rounded-full" data-profile-id="profile-1" title="Editar Perfil">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg>
                                        </button>
                                        <button class="delete-profile-btn p-1 text-red-600 hover:bg-red-100 rounded-full" data-profile-id="profile-1" title="Eliminar Perfil">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        """)

        # Click on the accordion header to expand it
        await page.click(".accordion-header")

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

asyncio.run(main())
