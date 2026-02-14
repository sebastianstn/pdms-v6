import { test, expect } from "@playwright/test";

function generateUniqueAhv(): string {
    const tail = `${Date.now()}${Math.floor(Math.random() * 10000)}`
        .replace(/\D/g, "")
        .slice(-10)
        .padStart(10, "0");
    return `756.${tail.slice(0, 4)}.${tail.slice(4, 8)}.${tail.slice(8, 10)}`;
}

/**
 * E2E-Tests: Patienten-Workflow
 * Testet CRUD-Operationen über die API
 */
test.describe("Patienten-Workflow", () => {
    const API_BASE = process.env.API_URL || "http://localhost:8000";

    test("Patientenliste abrufen", async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/v1/patients`);
        expect(response.ok()).toBeTruthy();
        const payload = await response.json();
        expect(Array.isArray(payload.items)).toBeTruthy();
        expect(typeof payload.total).toBe("number");
    });

    test("Patient erstellen und abrufen", async ({ request }) => {
        const uniqueAhv = generateUniqueAhv();

        // Patient erstellen
        const createResponse = await request.post(`${API_BASE}/api/v1/patients`, {
            data: {
                first_name: "E2E-Test",
                last_name: "Patient",
                date_of_birth: "1990-01-15",
                gender: "male",
                ahv_number: uniqueAhv,
                address_street: "Teststrasse 1",
                address_zip: "8000",
                address_city: "Zürich",
                phone: "+41 44 000 00 00",
            },
        });
        expect(createResponse.ok()).toBeTruthy();
        const patient = await createResponse.json();
        expect(patient.id).toBeTruthy();
        expect(patient.first_name).toBe("E2E-Test");

        // Patient abrufen
        const getResponse = await request.get(
            `${API_BASE}/api/v1/patients/${patient.id}`
        );
        expect(getResponse.ok()).toBeTruthy();
        const fetched = await getResponse.json();
        expect(fetched.last_name).toBe("Patient");
    });

    test("Patientensuche funktioniert", async ({ request }) => {
        const response = await request.get(
            `${API_BASE}/api/v1/patients?search=E2E`
        );
        expect(response.ok()).toBeTruthy();
        const payload = await response.json();
        expect(Array.isArray(payload.items)).toBeTruthy();
    });
});
