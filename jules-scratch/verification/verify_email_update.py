import asyncio
from playwright.async_api import async_playwright, expect
import json

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # 1. Cargar el contenido de index.html
        with open('index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()

        # 2. Inyectar la bandera de prueba y modificar el flujo de autenticación
        init_script = "<script>window.isTesting = true;</script>"
        modified_html = html_content.replace('<head>', '<head>' + init_script)

        modified_html = modified_html.replace(
            'onAuthStateChanged(auth, (user) => {',
            'onAuthStateChanged(auth, (user) => { if (window.isTesting) { startApp(); return; }'
        )

        # 3. Desactivar listeners de Firebase y la escritura en la BD
        modified_html = modified_html.replace('onSnapshot(', '// onSnapshot(')
        modified_html = modified_html.replace('await updateDoc(', '// await updateDoc(')

        # 4. Cargar la página y esperar a que la API de prueba esté disponible
        await page.set_content(modified_html, wait_until='domcontentloaded')
        await page.wait_for_function('window.testAPI')

        # 5. Inyectar datos de prueba
        test_platform_accounts = [{'id': 'acc1', 'email': 'walthorn@bobbur.com', 'password': 'password123', 'platform': 'Netflix'}]
        test_sales = [{'id': 'sale1', 'cliente': 'Anthony', 'correo': 'walthorn@bobbur.com', 'accountId': 'acc1', 'plataforma': 'Netflix', 'estado': 'ACTIVO'}, {'id': 'sale2', 'cliente': 'Junior', 'correo': 'walthorn@bobbur.com', 'accountId': 'acc1', 'plataforma': 'Netflix', 'estado': 'ACTIVO'}]

        await page.evaluate(f'window.testAPI.allPlatformAccounts = {json.dumps(test_platform_accounts)}')
        await page.evaluate(f'window.testAPI.allSales = {json.dumps(test_sales)}')

        # 6. Ir a la vista de "Cuentas" y renderizar los datos
        await page.get_by_role("link", name="Cuentas").click()
        await page.evaluate('window.testAPI.renderPlatformAccounts()')
        await expect(page.get_by_text("walthorn@bobbur.com")).to_be_visible()

        # 7. Simular la edición del correo
        await page.locator('.edit-account-btn[data-id="acc1"]').click()
        await expect(page.locator("#edit-account-modal")).to_be_visible()

        new_email = "Sphinx126@bobbur.com"
        await page.locator("#edit-account-email").fill(new_email)
        await page.get_by_role("button", name="Guardar Cambios").click()
        await expect(page.locator("#edit-account-modal")).to_be_hidden()

        # 8. Ir a la vista de "Ventas" y verificar que la lógica en memoria funcionó
        await page.get_by_role("link", name="Ventas").click()
        await page.evaluate('window.testAPI.applyFiltersAndRender(window.testAPI.allSales)')
        await expect(page.get_by_role("heading", name=new_email)).to_be_visible()

        # 9. Tomar la captura de pantalla
        screenshot_path = "jules-scratch/verification/verification.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot taken and saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
