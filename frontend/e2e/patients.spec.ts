import { test, expect } from "@playwright/test";

/**
 * E2E-Tests: Patienten-Workflow
 * Testet CRUD-Operationen über die API
 */
test.describe("Patienten-Workflow", () => {
    const API_BASE = process.env.API_URL || "http://localhost:8000";

    test("Patientenliste abrufen", async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/v1/patients`);
        expect(response.ok()).toBeTruthy();
        const patients = await response.json();
        expect(Array.isArray(patients)).toBeTruthy();
    });

    test("Patient erstellen und abrufen", async ({ request }) => {
        // Patient erstellen
        const createResponse = await request.post(`${API_BASE}/api/v1/patients`, {
            data: {
                first_name: "E2E-Test",
                last_name: "Patient",
                date_of_birth: "1990-01-15",
                gender: "male",
                ahv_number: "756.1234.5678.97",
                address: "Teststrasse 1, 8000 Zürich",
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
        const results = await response.json();
        expect(Array.isArray(results)).toBeTruthy();
    });
});
