"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface MessageUser {
  id: string;
  username: string;
  full_name: string | null;
  role: string;
}

export interface ChatMessage {
  id: string;
  sender_user_id: string;
  sender_username: string;
  recipient_user_id: string;
  recipient_username: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  current_user_id: string;
  other_user_id: string;
  messages: ChatMessage[];
}

interface UnreadCount {
  unread: number;
}

const keys = {
  users: ["messages", "users"] as const,
  conversation: (otherUserId: string) => ["messages", "conversation", otherUserId] as const,
  unread: ["messages", "unread"] as const,
};

export function useMessageUsers(enabled = true) {
  return useQuery<MessageUser[]>({
    queryKey: keys.users,
    queryFn: () => api.get<MessageUser[]>("/messages/users"),
    enabled,
    staleTime: 60_000,
  });
}

export function useUnreadMessages(enabled = true) {
  return useQuery<UnreadCount>({
    queryKey: keys.unread,
    queryFn: () => api.get<UnreadCount>("/messages/unread-count"),
    enabled,
    refetchInterval: 10_000,
  });
}

export function useConversation(otherUserId: string | null, enabled = true) {
  return useQuery<Conversation>({
    queryKey: keys.conversation(otherUserId || "none"),
    queryFn: () => api.get<Conversation>(`/messages/conversation/${otherUserId}`),
    enabled: enabled && !!otherUserId,
    refetchInterval: 5_000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ recipient_user_id, content }: { recipient_user_id: string; content: string }) =>
      api.post<ChatMessage>("/messages", { recipient_user_id, content }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: keys.conversation(vars.recipient_user_id) });
      qc.invalidateQueries({ queryKey: keys.unread });
    },
  });
}
