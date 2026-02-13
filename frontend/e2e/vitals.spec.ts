import { test, expect } from "@playwright/test";

/**
 * E2E-Tests: Vitaldaten
 * Testet Erfassung und Abruf von Vitaldaten
 */
test.describe("Vitaldaten-Workflow", () => {
    const API_BASE = process.env.API_URL || "http://localhost:8000";

    test("Vitaldaten für Patient abrufen", async ({ request }) => {
        // Zuerst Patienten holen
        const patientsRes = await request.get(`${API_BASE}/api/v1/patients`);
        const patients = await patientsRes.json();

        if (patients.length > 0) {
            const patientId = patients[0].id;
            const vitalsRes = await request.get(
                `${API_BASE}/api/v1/vitals?patient_id=${patientId}`
            );
            expect(vitalsRes.ok()).toBeTruthy();
            const vitals = await vitalsRes.json();
            expect(Array.isArray(vitals)).toBeTruthy();
        }
    });

    test("Vitaldaten erfassen", async ({ request }) => {
        // Patient-ID holen
        const patientsRes = await request.get(`${API_BASE}/api/v1/patients`);
        const patients = await patientsRes.json();

        if (patients.length > 0) {
            const patientId = patients[0].id;
            const response = await request.post(`${API_BASE}/api/v1/vitals`, {
                data: {
                    patient_id: patientId,
                    heart_rate: 72,
                    systolic_bp: 120,
                    diastolic_bp: 80,
                    temperature: 36.8,
                    respiratory_rate: 16,
                    spo2: 98,
                },
            });
            expect(response.ok()).toBeTruthy();
            const vital = await response.json();
            expect(vital.heart_rate).toBe(72);
        }
    });

    test("Alarm-Endpoint erreichbar", async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/v1/alarms`);
        expect(response.ok()).toBeTruthy();
    });
});
