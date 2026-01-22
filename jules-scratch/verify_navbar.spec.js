const { test, expect } = require('@playwright/test');

test.describe('Navbar Layout Verification', () => {

    test('Verify Desktop Navbar', async ({ page }) => {
        await page.goto('http://localhost:8000/index_test.html');
        await page.setViewportSize({ width: 1280, height: 720 });

        // Check Desktop Navbar is visible
        const desktopNavbar = page.locator('#desktop-navbar');
        await expect(desktopNavbar).toBeVisible();

        // Check Links
        await expect(page.locator('#nav-dashboard')).toBeVisible();
        await expect(page.locator('#nav-cuentas')).toBeVisible();

        // Check Sidebar is hidden (Mobile drawer)
        // Note: #sidebar has fixed position and is translated off screen (-100%)
        // So checking toBeVisible() might return true if it's in the DOM and has dimensions, even if off-screen.
        // But we added md:hidden to its classes which sets display: none via our custom style block.
        // So toBeHidden() should pass if md:hidden works.
        await expect(page.locator('#sidebar')).toBeHidden();

        // Verify navigation works (click Cuentas)
        await page.locator('#nav-cuentas').click();
        await expect(page.locator('#cuentas-view')).toBeVisible();
        await expect(page.locator('#dashboard-view')).toBeHidden();

        // Take Screenshot
        await page.screenshot({ path: 'jules-scratch/desktop_navbar.png' });
    });

    test('Verify Mobile Drawer', async ({ page }) => {
        await page.goto('http://localhost:8000/index_test.html');
        await page.setViewportSize({ width: 375, height: 667 });

        // Check Desktop Navbar elements are responsive
        // The nav links should be hidden
        await expect(page.locator('#nav-dashboard')).toBeHidden();

        // Hamburger button should be visible
        // Target the button that has the hamburger icon path
        const hamburgerBtn = page.locator('#desktop-navbar button:has(svg path[d^="M4 6h16"])');
        await expect(hamburgerBtn).toBeVisible();

        // Sidebar should be hidden initially (translated off-screen)
        const sidebar = page.locator('#sidebar');
        await expect(sidebar).not.toHaveClass(/open/);

        // Click Hamburger
        await hamburgerBtn.click();

        // Sidebar should now be open
        await expect(sidebar).toHaveClass(/open/);

        // Check Mobile Links
        await expect(page.locator('#mobile-nav-dashboard')).toBeVisible();

        // Navigate via Mobile Menu
        await page.locator('#mobile-nav-cuentas').click();
        await expect(page.locator('#cuentas-view')).toBeVisible();

        // Sidebar should close after navigation
        await expect(sidebar).not.toHaveClass(/open/);

        // Take Screenshot
        await page.screenshot({ path: 'jules-scratch/mobile_drawer.png' });
    });
});
