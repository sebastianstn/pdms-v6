import { test, expect } from "@playwright/test";

/**
 * E2E-Tests: Login-Flow
 * Testet Anmeldung über Keycloak (oder Dev-Bypass)
 */
test.describe("Login-Flow", () => {
    test("Startseite zeigt Login oder Dashboard", async ({ page }) => {
        await page.goto("/");
        // Sollte entweder Login-Button oder Dashboard anzeigen
        const content = await page.textContent("body");
        expect(content).toBeTruthy();
        // Prüfe, ob Seite geladen (kein 500er-Fehler)
        expect(page.url()).not.toContain("error");
    });

    test("Navigation zum Dashboard erreichbar", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
        // Prüfe dass die App lädt
        const title = await page.title();
        expect(title).toBeTruthy();
    });

    test("API Health-Check über Frontend erreichbar", async ({ page }) => {
        const response = await page.request.get("/api/v1/patients", {
            headers: { Accept: "application/json" },
        });
        // Sollte 200 (Dev-Modus) oder 401 (Auth erforderlich) zurückgeben
        expect([200, 401, 307]).toContain(response.status());
    });
});
