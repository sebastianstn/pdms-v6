"use client";

import { useRemoteDevices, useReportReading, useMarkDeviceOffline } from "@/hooks/use-remote-devices";
import { Card, CardHeader, CardContent, CardTitle, Badge, Spinner } from "@/components/ui";
import { DEVICE_TYPE_LABELS } from "@pdms/shared-types";
import type { RemoteDevice, DeviceType } from "@pdms/shared-types";

const DEVICE_ICON: Record<string, string> = {
    pulsoximeter: "❤",
    blood_pressure: "↕",
    scale: "⚖",
    thermometer: "°",
    glucometer: "◎",
};

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "gerade eben";
    if (minutes < 60) return `vor ${minutes} Min.`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Std.`;
    const days = Math.floor(hours / 24);
    return `vor ${days} Tag${days > 1 ? "en" : ""}`;
}

function batteryColor(level: number | null | undefined): string {
    if (level == null) return "text-slate-500";
    if (level > 50) return "text-green-600";
    if (level > 20) return "text-amber-600";
    return "text-red-600";
}

interface RemoteDevicePanelProps {
    patientId: string;
}

export function RemoteDevicePanel({ patientId }: RemoteDevicePanelProps) {
    const { data, isLoading } = useRemoteDevices(patientId);

    if (isLoading) {
        return (
            <Card>
                <CardContent>
                    <div className="flex justify-center py-8"><Spinner size="md" /></div>
                </CardContent>
            </Card>
        );
    }

    const devices = data ?? [];
    const online = devices.filter((d: RemoteDevice) => d.is_online).length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Fernüberwachung</CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="success">{online} online</Badge>
                        {devices.length - online > 0 && (
                            <Badge variant="danger">{devices.length - online} offline</Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {devices.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">Keine Geräte registriert.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {devices.map((device) => (
                            <DeviceCard key={device.id} device={device} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DeviceCard({ device }: { device: RemoteDevice }) {
    const icon = DEVICE_ICON[device.device_type] ?? "📟";
    const label = DEVICE_TYPE_LABELS[device.device_type as DeviceType] ?? device.device_type;

    const hasAlert =
        device.last_reading_value != null &&
        device.alert_threshold_high != null &&
        device.last_reading_value > device.alert_threshold_high;

    const hasLowAlert =
        device.last_reading_value != null &&
        device.alert_threshold_low != null &&
        device.last_reading_value < device.alert_threshold_low;

    return (
        <div
            className={`border rounded-lg p-3 space-y-2 transition-colors ${hasAlert || hasLowAlert
                ? "border-red-200 bg-red-50"
                : device.is_online
                    ? "border-green-100 bg-green-50/30"
                    : "border-slate-100 bg-slate-50"
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-medium text-slate-800">{label}</span>
                </div>
                <span className={`text-xs ${device.is_online ? "text-green-600" : "text-slate-500"}`}>
                    {device.is_online ? "● Online" : "○ Offline"}
                </span>
            </div>

            {/* Last Reading */}
            {device.last_reading_value != null ? (
                <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold ${hasAlert || hasLowAlert ? "text-red-700" : "text-slate-900"}`}>
                        {device.last_reading_value}
                    </span>
                    <span className="text-xs text-slate-500">{device.last_reading_unit ?? ""}</span>
                    {(hasAlert || hasLowAlert) && <span className="text-xs text-red-600 ml-1">Alarm</span>}
                </div>
            ) : (
                <p className="text-sm text-slate-500">Kein Messwert</p>
            )}

            {/* Footer: battery + last reading time */}
            <div className="flex items-center justify-between text-xs text-slate-500">
                {device.battery_level != null && (
                    <span className={batteryColor(device.battery_level)}>
                        Bat. {device.battery_level}%
                    </span>
                )}
                {device.last_reading_at && (
                    <span>{timeAgo(device.last_reading_at)}</span>
                )}
            </div>

            {/* Threshold Info */}
            {(device.alert_threshold_low != null || device.alert_threshold_high != null) && (
                <div className="text-[10px] text-slate-500">
                    Schwellwerte: {device.alert_threshold_low ?? "–"} – {device.alert_threshold_high ?? "–"} {device.last_reading_unit ?? ""}
                </div>
            )}
        </div>
    );
}
