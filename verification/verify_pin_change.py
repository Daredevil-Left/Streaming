from playwright.sync_api import sync_playwright
import time

def test_pin_change_modal(page):
    # Route for gstatic imports
    page.route("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js", lambda route: route.fulfill(
        status=200,
        content_type="application/javascript",
        body="""
        export const collection = () => ({});
        export const addDoc = async () => ({ id: '123' });
        export const onSnapshot = (ref, cb) => {
            if (ref.type === 'accounts') {
                cb({
                    docs: [{
                        id: 'acc1',
                        data: () => ({
                            platform: 'Netflix',
                            email: 'test@example.com',
                            password: 'testpassword',
                            profiles: [{id: 'prof1', nombre: 'Perfil 1', pin: '1234', estado: 'Ocupado', clienteId: 'sale1'}]
                        })
                    }]
                });
            } else if (ref.type === 'sales') {
                cb({
                    docs: [{
                        id: 'sale1',
                        data: () => ({
                            cliente: 'Juan Perez',
                            plataforma: 'Netflix',
                            precio: 15,
                            inicioPlan: '2023-01-01',
                            finPlan: '2023-02-01',
                            estado: 'ACTIVO',
                            accountId: 'acc1',
                            profileId: 'prof1',
                            correo: 'test@example.com',
                            contrasena: 'testpassword',
                            pin: '1234'
                        })
                    }]
                });
            } else if (ref.type === 'config') {
                cb({ exists: () => false });
            } else {
                cb({ docs: [] });
            }
        };
        export const doc = () => ({});
        export const updateDoc = async () => {};
        export const deleteDoc = async () => {};
        export const getDocs = async () => ({ docs: [{ id: 'prof1', data: () => ({ nombre: 'Perfil 1', pin: '1234', estado: 'Ocupado', clienteId: 'sale1' }) }] });
        export const setDoc = async () => {};
        export const getDoc = async () => ({ exists: () => true, data: () => ({ services: [] }) });
        export const deleteField = () => {};
        """
    ))

    page.route("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js", lambda route: route.fulfill(
        status=200,
        content_type="application/javascript",
        body="""
        export const onAuthStateChanged = (auth, cb) => cb({email: 'renzosamanamud@gmail.com'});
        export const signOut = async () => {};
        """
    ))

    # Mock the firebase config
    page.route("**/firebase-config.js", lambda route: route.fulfill(
        status=200,
        content_type="application/javascript",
        body="""
        export const db = {};
        export const auth = {};
        """
    ))

    # Wait for the view to render
    page.goto('file://' + __import__('os').path.abspath('index.html'))

    # Wait for loading state to disappear
    page.locator("#loading-state").wait_for(state="hidden")

    # Manually populate some mock data to trigger the modal
    # Because onSnapshot mock might be tricky to set up perfectly for all internal state, we can just call the function directly
    page.evaluate("""
        window.allSales = [{
            id: 'sale1',
            cliente: 'Juan Perez',
            plataforma: 'Amazon Prime Video',
            precio: 15,
            inicioPlan: '2023-01-01',
            finPlan: '2023-02-01',
            estado: 'ACTIVO',
            accountId: 'acc1',
            profileId: 'prof1',
            correo: 'test@amazon.com',
            contrasena: 'amzpass123',
            pin: '1234'
        }];
        window.allPlatformAccounts = [{
            id: 'acc1',
            platform: 'Amazon Prime Video',
            email: 'test@amazon.com',
            password: 'amzpass123',
            profiles: [{id: 'prof1', nombre: 'Perfil 1', pin: '1234', estado: 'Ocupado', clienteId: 'sale1'}]
        }];

        // Mock getProfileOccupancy to show it's shared (e.g. crunchyroll scenario, or just to test the warning)
        window.getProfileOccupancy = () => ({
            count: 1, // Still one left
            max: 2,
            isAvailable: true,
            sales: [{id: 'sale2', cliente: 'Maria'}]
        });

        // Trigger the delete action directly to show the modal
        // Since handlePermanentDeleteAction is enclosed, we'll just mock the showPinChangeAlertModal call directly to see how it looks
        // OR we can click the delete button if we render it.
    """)

    # We can just call showPinChangeAlertModal directly via evaluate
    # But wait, it's not exported to window. Let's make a quick patch to export it to window for testing.

    page.evaluate("""
        window.showPinChangeAlertModal(
            window.allSales[0],
            window.allPlatformAccounts[0].profiles[0],
            window.allPlatformAccounts[0],
            '1234',
            '98765',
            true
        );
    """)

    time.sleep(1) # Let animation finish

    # Take a screenshot
    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            test_pin_change_modal(page)
        finally:
            browser.close()
