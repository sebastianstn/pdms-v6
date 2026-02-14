"use client";

import { FormEvent, useMemo, useState } from "react";

import { useConversation, useMessageUsers, useSendMessage, useUnreadMessages } from "@/hooks/use-messages";

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

export function MessageCenter() {
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [messageText, setMessageText] = useState("");

    const usersQuery = useMessageUsers();
    const unreadQuery = useUnreadMessages();
    const conversationQuery = useConversation(selectedUserId || null, !!selectedUserId);
    const sendMessage = useSendMessage();

    const selectedUser = useMemo(
        () => usersQuery.data?.find((u) => u.id === selectedUserId) ?? null,
        [usersQuery.data, selectedUserId]
    );

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const content = messageText.trim();
        if (!selectedUserId || !content || sendMessage.isPending) return;

        await sendMessage.mutateAsync({ recipient_user_id: selectedUserId, content });
        setMessageText("");
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-slate-900">Mitteilungszentrale</h3>
                <span className="text-[10px] px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold">
                    {unreadQuery.data?.unread ?? 0} ungelesen
                </span>
            </div>

            <label className="block text-[10px] font-semibold text-slate-600 mb-1">Empfänger</label>
            <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] mb-3 bg-white"
            >
                <option value="">Bitte Benutzer auswählen …</option>
                {(usersQuery.data ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                        {u.full_name ? `${u.full_name} (${u.username})` : u.username} · {u.role}
                    </option>
                ))}
            </select>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 h-64 overflow-y-auto p-3 mb-3 space-y-2">
                {!selectedUserId ? (
                    <p className="text-[11px] text-slate-500">Wähle links einen Benutzer aus, um den Chat zu starten.</p>
                ) : conversationQuery.isLoading ? (
                    <p className="text-[11px] text-slate-500">Lade Unterhaltung …</p>
                ) : (conversationQuery.data?.messages.length ?? 0) === 0 ? (
                    <p className="text-[11px] text-slate-500">Noch keine Mitteilungen mit diesem Benutzer.</p>
                ) : (
                    conversationQuery.data?.messages.map((msg) => {
                        const isOwn = msg.sender_user_id === conversationQuery.data.current_user_id;
                        return (
                            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] shadow-sm ${isOwn
                                            ? "bg-blue-600 text-white rounded-br-sm"
                                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                                        }`}
                                >
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    <p className={`mt-1 text-[9px] ${isOwn ? "text-blue-100" : "text-slate-500"}`}>
                                        {isOwn ? "Du" : msg.sender_username} · {formatTime(msg.created_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={onSubmit} className="space-y-2">
                <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={selectedUser ? `Nachricht an ${selectedUser.username} …` : "Bitte zuerst Empfänger auswählen …"}
                    disabled={!selectedUserId || sendMessage.isPending}
                    maxLength={2000}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] resize-none disabled:bg-slate-100"
                />
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{messageText.length}/2000</span>
                    <button
                        type="submit"
                        disabled={!selectedUserId || !messageText.trim() || sendMessage.isPending}
                        className="px-3 py-1.5 text-[11px] font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        {sendMessage.isPending ? "Sende …" : "Senden"}
                    </button>
                </div>
            </form>
        </div>
    );
}
