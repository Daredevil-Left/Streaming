const { test, expect } = require('@playwright/test');

test('Verify Dashboard Buttons and Take Screenshot', async ({ page }) => {
    // 1. Navigate to the test file
    await page.goto('http://localhost:8000/index_test.html');

    // 2. Wait for the mock data to load
    await page.waitForTimeout(1000);

    // 3. Locate the Netflix button
    const netflixButton = page.locator('#available-accounts-grid div').filter({ hasText: 'Netflix' }).first();
    await expect(netflixButton).toBeVisible();

    // 4. Click the button
    await netflixButton.click();

    // 5. Verify View Switch
    const ventasView = page.locator('#ventas-view');
    await expect(ventasView).not.toHaveClass(/hidden/);

    // 6. Verify Form Population
    await expect(page.locator('#plataforma')).toHaveValue('Netflix');
    await expect(page.locator('#platform-account')).toHaveValue('acc1');
    await expect(page.locator('#profile-select')).toHaveValue('p1');

    // 7. Take Screenshot
    await page.screenshot({ path: 'verification.png' });
});
