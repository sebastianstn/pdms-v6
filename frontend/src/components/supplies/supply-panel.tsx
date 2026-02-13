"use client";

/**
 * SupplyPanel — Verbrauchsmaterial-Übersicht + Erfassung.
 */
import { useSupplyItems, useLowStockItems, useSupplyUsages, useCreateSupplyUsage } from "@/hooks/use-supplies";
import { Card, CardHeader, CardContent, CardTitle, Spinner } from "@/components/ui";
import { SUPPLY_CATEGORY_LABELS, type SupplyCategory } from "@pdms/shared-types";
import { useState, type FormEvent } from "react";

interface Props {
    patientId: string;
}

export function SupplyPanel({ patientId }: Props) {
    const { data: lowStock } = useLowStockItems();
    const { data: usagesData, isLoading: usagesLoading } = useSupplyUsages(patientId);
    const { data: itemsData } = useSupplyItems();
    const createUsage = useCreateSupplyUsage();

    const [showForm, setShowForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState("");

    const items = itemsData?.items ?? [];
    const lowStockItems = lowStock ?? [];

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        await createUsage.mutateAsync({
            patient_id: patientId,
            supply_item_id: selectedItem,
            quantity,
            reason: reason || undefined,
        });
        setShowForm(false);
        setSelectedItem("");
        setQuantity(1);
        setReason("");
    }

    return (
        <div className="space-y-4">
            {/* Low-Stock-Warnung */}
            {lowStockItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Nachbestellung nötig</h4>
                    <div className="flex flex-wrap gap-2">
                        {lowStockItems.map((item) => (
                            <span key={item.id} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                                {item.name}: {item.stock_quantity} / min. {item.min_stock} {item.unit}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Material-Verbrauch erfassen */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Verbrauchsmaterial</CardTitle>
                        <button
                            onClick={() => setShowForm((v) => !v)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {showForm ? "Schliessen" : "+ Verbrauch erfassen"}
                        </button>
                    </div>
                </CardHeader>
                <CardContent>
                    {showForm && (
                        <form onSubmit={handleSubmit} className="mb-4 p-3 bg-slate-50 rounded-lg space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Material *</label>
                                <select
                                    value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                >
                                    <option value="">Auswählen…</option>
                                    {items.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({SUPPLY_CATEGORY_LABELS[item.category as SupplyCategory] ?? item.category}) — Bestand: {item.stock_quantity}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Menge *</label>
                                    <input
                                        type="number" min={1} value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Grund</label>
                                    <input
                                        value={reason} onChange={(e) => setReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                        placeholder="z.B. Verbandswechsel"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit" disabled={createUsage.isPending}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {createUsage.isPending ? "…" : "Verbrauch buchen"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Letzte Verbräuche */}
                    {usagesLoading ? (
                        <div className="flex justify-center py-6"><Spinner size="sm" /></div>
                    ) : (usagesData?.items ?? []).length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">Kein Materialverbrauch dokumentiert.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-2 text-xs font-medium text-slate-500">Material</th>
                                    <th className="text-right py-2 text-xs font-medium text-slate-500">Menge</th>
                                    <th className="text-left py-2 pl-4 text-xs font-medium text-slate-500">Grund</th>
                                    <th className="text-right py-2 text-xs font-medium text-slate-500">Datum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(usagesData?.items ?? []).map((u) => {
                                    const item = items.find((i) => i.id === u.supply_item_id);
                                    return (
                                        <tr key={u.id} className="border-b border-slate-100">
                                            <td className="py-2 text-slate-700">{item?.name ?? "–"}</td>
                                            <td className="py-2 text-right font-medium">{u.quantity}</td>
                                            <td className="py-2 pl-4 text-slate-500">{u.reason ?? "–"}</td>
                                            <td className="py-2 text-right text-xs text-slate-400">
                                                {new Date(u.created_at).toLocaleDateString("de-CH", {
                                                    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                                                })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
