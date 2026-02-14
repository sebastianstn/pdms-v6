"use client";

import { useRemoteDevices } from "@/hooks/use-remote-devices";
import { DEVICE_TYPE_LABELS, type RemoteDevice } from "@pdms/shared-types";
import { BatteryLow } from "lucide-react";

interface RemoteDevicesPanelProps {
    patientId: string | null;
}

function getDeviceStatus(device: RemoteDevice): "online" | "warning" | "offline" {
    if (!device.is_online) return "offline";
    if (device.last_reading_at) {
        const ago = Date.now() - new Date(device.last_reading_at).getTime();
        if (ago > 48 * 3600_000) return "warning";
    }
    return "online";
}

function timeAgo(isoDate?: string): string {
    if (!isoDate) return "—";
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "gerade eben";
    if (mins < 60) return `vor ${mins} Min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `vor ${hours}h`;
    const days = Math.floor(hours / 24);
    return `vor ${days} Tagen`;
}

export function RemoteDevicesPanel({ patientId }: RemoteDevicesPanelProps) {
    const { data: devices, isLoading } = useRemoteDevices(patientId ?? "");

    if (!patientId) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h3 className="text-[13px] font-bold text-slate-900 mb-3">Remote-Geräte</h3>
                <p className="text-[11px] text-slate-500 text-center py-4">Patient auswählen</p>
            </div>
        );
    }

    const deviceList = devices ?? [];
    const onlineCount = deviceList.filter((d) => d.is_online).length;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-slate-900">Remote-Geräte</h3>
                <span className="text-[10px] text-slate-500">
                    {isLoading ? "…" : `${onlineCount}/${deviceList.length} online`}
                </span>
            </div>
            {isLoading ? (
                <div className="flex items-center justify-center py-4">
                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : deviceList.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-4">Keine Geräte registriert</p>
            ) : (
                <div className="space-y-2">
                    {deviceList.map((device) => {
                        const status = getDeviceStatus(device);
                        const statusColor =
                            status === "online"
                                ? { bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-600", val: "text-emerald-600" }
                                : status === "warning"
                                  ? { bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", text: "text-amber-600", val: "text-amber-600" }
                                  : { bg: "bg-red-50 border-red-200", dot: "bg-red-400", text: "text-red-500", val: "text-red-500" };

                        return (
                            <div
                                key={device.id}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${statusColor.bg}`}
                            >
                                <div className={`w-3 h-3 rounded-full shrink-0 ${statusColor.dot}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold text-slate-900">
                                        {DEVICE_TYPE_LABELS[device.device_type] ?? device.device_name}
                                    </p>
                                    <p className={`text-[9px] ${statusColor.text}`}>
                                        {status === "online" ? "Online" : status === "warning" ? "Letzte Messung" : "Offline"}
                                        {": "}
                                        {timeAgo(device.last_reading_at ?? device.last_seen_at)}
                                    </p>
                                </div>
                                {device.last_reading_value && (
                                    <span className={`text-sm font-extrabold shrink-0 ${statusColor.val}`}>
                                        {device.last_reading_value}
                                        {device.last_reading_unit ? ` ${device.last_reading_unit}` : ""}
                                    </span>
                                )}
                                {device.battery_level != null && device.battery_level < 20 && (
                                    <span className="text-[8px] text-red-500 font-medium shrink-0 inline-flex items-center gap-0.5">
                                        <BatteryLow className="w-3 h-3" /> {device.battery_level}%
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
