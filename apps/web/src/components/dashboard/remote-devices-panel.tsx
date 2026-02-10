"use client";

interface RemoteDevicesPanelProps {
  patientId: string | null;
}

interface Device {
  name: string;
  status: "online" | "warning" | "offline";
  lastValue: string;
  lastSeen: string;
  compact?: boolean;
}

const DEMO_DEVICES: Device[] = [
  { name: "Pulsoximeter", status: "online", lastValue: "96%", lastSeen: "vor 2 Min" },
  { name: "Blutdruckmessgerät", status: "online", lastValue: "128/82", lastSeen: "08:30" },
  { name: "Körperwaage", status: "warning", lastValue: "82 kg", lastSeen: "vor 2 Tagen" },
];

const COMPACT_DEVICES: Device[] = [
  { name: "Thermometer", status: "online", lastValue: "", lastSeen: "", compact: true },
  { name: "Glukometer", status: "online", lastValue: "", lastSeen: "", compact: true },
];

export function RemoteDevicesPanel({ patientId }: RemoteDevicesPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-slate-900">Remote-Geräte</h3>
        <span className="text-[10px] text-slate-400">{patientId ? "A. König" : "—"}</span>
      </div>

      {/* Devices */}
      <div className="space-y-2">
        {DEMO_DEVICES.map((device, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
              device.status === "online"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            {/* Status Dot */}
            <div className={`w-3 h-3 rounded-full shrink-0 ${
              device.status === "online" ? "bg-emerald-500" : "bg-amber-500"
            }`}>
              {device.status === "warning" && (
                <span className="flex items-center justify-center text-white text-[6px] font-bold h-full">!</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-slate-900">{device.name}</p>
              <p className={`text-[9px] ${
                device.status === "online" ? "text-emerald-600" : "text-amber-600"
              }`}>
                {device.status === "online" ? "Online" : "Letzte Messung"}: {device.lastSeen}
              </p>
            </div>

            {/* Value */}
            <span className={`text-sm font-extrabold shrink-0 ${
              device.status === "online" ? "text-emerald-600" : "text-amber-600"
            }`}>
              {device.lastValue}
            </span>
          </div>
        ))}
      </div>

      {/* Compact Devices Row */}
      <div className="flex gap-2 mt-2">
        {COMPACT_DEVICES.map((device, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 flex-1"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[9px] text-slate-500">{device.name} ✓</span>
          </div>
        ))}
      </div>
    </div>
  );
}
