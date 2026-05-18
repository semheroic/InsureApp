import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Check,
  Loader2,
  MessageSquareText,
  Pencil,
  Search,
  SendHorizonal,
  Signal,
  SignalHigh,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL;

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_picture?: string | null;
};

type ChatUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  profile_picture?: string | null;
  online?: boolean;
  unread_count?: number;
  last_message?: string | null;
  last_message_at?: string | null;
  last_message_is_read?: number;
  last_message_read_at?: string | null;
  last_message_sender_id?: number | null;
  last_message_recipient_id?: number | null;
};

type ChatMessage = {
  id: number;
  sender_id: number;
  recipient_id: number;
  message: string;
  is_read: number;
  created_at: string;
  updated_at: string;
  read_at: string | null;
  sender_name?: string;
  sender_profile_picture?: string | null;
  recipient_name?: string;
  recipient_profile_picture?: string | null;
};

type SocketMessage =
  | { type: "chat:ready"; userId: number; onlineUserIds: number[] }
  | { type: "chat:presence"; userId: number; online: boolean; onlineUserIds: number[] }
  | { type: "chat:message"; message: ChatMessage }
  | { type: "chat:updated"; message: ChatMessage }
  | { type: "chat:deleted"; messageId: number; senderId: number; recipientId: number }
  | { type: "chat:read"; readerId: number; readAt: string }
  | { type: "chat:typing"; senderId: number; isTyping: boolean };

type RealtimeChatSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const resolveMediaUrl = (value?: string | null) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${API_URL}${value}`;
};

const buildSocketUrl = () => {
  const source = API_URL || window.location.origin;
  const url = new URL(source);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/chat";
  url.search = "";
  url.hash = "";
  return url.toString();
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("") || "U";

const formatMessageTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatConversationTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const sameDay = now.toDateString() === date.toDateString();

  if (sameDay) {
    return formatMessageTime(value);
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

const upsertMessage = (messages: ChatMessage[], nextMessage: ChatMessage) => {
  const existingIndex = messages.findIndex(message => message.id === nextMessage.id);

  if (existingIndex === -1) {
    return [...messages, nextMessage].sort((a, b) => a.id - b.id);
  }

  const updated = [...messages];
  updated[existingIndex] = nextMessage;
  return updated;
};

const removeMessageById = (messages: ChatMessage[], messageId: number) =>
  messages.filter(message => message.id !== messageId);

export default function RealtimeChatSheet({ open, onOpenChange }: RealtimeChatSheetProps) {
  const { toast } = useToast();
  const socketRef = useRef<WebSocket | null>(null);
  const currentUserRef = useRef<AuthUser | null>(null);
  const selectedUserIdRef = useRef<number | null>(null);
  const socketConnectedRef = useRef(false);
  const typingTimerRef = useRef<number | null>(null);
  const typingExpiryRef = useRef<Map<number, number>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [conversations, setConversations] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});

  const clearTypingTimer = () => {
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  };

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    setEditingMessageId(null);
    setDraft("");
    clearTypingTimer();
  }, [selectedUserId]);

  useEffect(() => {
    socketConnectedRef.current = socketConnected;
  }, [socketConnected]);

  useEffect(() => {
    if (!open) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(url, {
      credentials: "include",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  };

  const loadUsers = async () => {
    const data = await fetchJson<{ users: ChatUser[] }>(`${API_URL}/api/chat/users`);
    setUsers(data.users || []);
  };

  const loadConversations = async () => {
    const data = await fetchJson<{ conversations: ChatUser[] }>(`${API_URL}/api/chat/conversations`);
    setConversations(data.conversations || []);
  };

  const markConversationRead = async (userId: number) => {
    const user = currentUserRef.current;
    if (!user) {
      return;
    }

    const data = await fetchJson<{ updated: number; readAt: string }>(
      `${API_URL}/api/chat/conversations/${userId}/read`,
      { method: "PUT" }
    );

    if (data.updated > 0) {
      setMessages(prev =>
        prev.map(message =>
          message.sender_id === userId && message.recipient_id === user.id
            ? { ...message, is_read: 1, read_at: data.readAt }
            : message
        )
      );

      setConversations(prev =>
        prev.map(conversation =>
          conversation.id === userId
            ? { ...conversation, unread_count: 0 }
            : conversation
        )
      );
    }
  };

  const loadMessages = async (userId: number, options?: { silent?: boolean; markRead?: boolean }) => {
    if (!options?.silent) {
      setMessageLoading(true);
    }

    try {
      const data = await fetchJson<{ participant: ChatUser; messages: ChatMessage[] }>(
        `${API_URL}/api/chat/messages/${userId}?limit=100`
      );

      setMessages(data.messages || []);

      if (options?.markRead !== false) {
        await markConversationRead(userId);
      }
    } finally {
      if (!options?.silent) {
        setMessageLoading(false);
      }
    }
  };

  const refreshSidebar = async () => {
    await Promise.all([loadUsers(), loadConversations()]);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);

      try {
        const [me, chatUsers, chatConversations] = await Promise.all([
          fetchJson<AuthUser>(`${API_URL}/auth/me`),
          fetchJson<{ users: ChatUser[] }>(`${API_URL}/api/chat/users`),
          fetchJson<{ conversations: ChatUser[] }>(`${API_URL}/api/chat/conversations`),
        ]);

        if (cancelled) {
          return;
        }

        setCurrentUser(me);
        setUsers(chatUsers.users || []);
        setConversations(chatConversations.conversations || []);

        const firstConversationId = chatConversations.conversations?.[0]?.id ?? null;
        const fallbackUserId = chatUsers.users?.[0]?.id ?? null;
        const initialSelectedUserId = selectedUserIdRef.current || firstConversationId || fallbackUserId;

        if (initialSelectedUserId) {
          setSelectedUserId(initialSelectedUserId);
        } else {
          setMessages([]);
        }
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "Chat unavailable",
            description: err instanceof Error ? err.message : "Unable to load chat right now.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [open, toast]);

  useEffect(() => {
    if (!open) {
      setSocketConnected(false);
      socketConnectedRef.current = false;
      socketRef.current?.close();
      socketRef.current = null;
      setTypingUsers({});
      return;
    }

    const socket = new WebSocket(buildSocketUrl());
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setSocketConnected(true);
    });

    socket.addEventListener("close", () => {
      setSocketConnected(false);
    });

    socket.addEventListener("error", () => {
      setSocketConnected(false);
    });

    socket.addEventListener("message", event => {
      try {
        const payload = JSON.parse(event.data) as SocketMessage;

        if (payload.type === "chat:ready" || payload.type === "chat:presence") {
          const onlineUserIds = new Set(payload.onlineUserIds || []);

          setUsers(prev =>
            prev.map(user => ({
              ...user,
              online: onlineUserIds.has(user.id),
            }))
          );

          setConversations(prev =>
            prev.map(conversation => ({
              ...conversation,
              online: onlineUserIds.has(conversation.id),
            }))
          );
          return;
        }

        if (payload.type === "chat:message") {
          const user = currentUserRef.current;
          if (!user) {
            return;
          }

          const message = payload.message;
          const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;

          void refreshSidebar().catch(() => undefined);

          if (selectedUserIdRef.current === otherUserId) {
            setMessages(prev => upsertMessage(prev, message));

            if (message.sender_id === otherUserId && message.recipient_id === user.id) {
              void markConversationRead(otherUserId).catch(() => undefined);
            }
          }

          if (!selectedUserIdRef.current) {
            setSelectedUserId(otherUserId);
          }

          return;
        }

        if (payload.type === "chat:updated") {
          const user = currentUserRef.current;
          if (!user) {
            return;
          }

          const message = payload.message;
          const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;

          void refreshSidebar().catch(() => undefined);

          if (selectedUserIdRef.current === otherUserId) {
            setMessages(prev => upsertMessage(prev, message));
          }

          return;
        }

        if (payload.type === "chat:deleted") {
          const user = currentUserRef.current;
          if (!user) {
            return;
          }

          const otherUserId = payload.senderId === user.id ? payload.recipientId : payload.senderId;

          void refreshSidebar().catch(() => undefined);

          if (selectedUserIdRef.current === otherUserId) {
            setMessages(prev => removeMessageById(prev, payload.messageId));
          }

          return;
        }

        if (payload.type === "chat:read") {
          setMessages(prev =>
            prev.map(message =>
              message.recipient_id === payload.readerId
                ? { ...message, is_read: 1, read_at: payload.readAt }
                : message
            )
          );
          void loadConversations().catch(() => undefined);
          return;
        }

        if (payload.type === "chat:typing") {
          if (payload.senderId !== selectedUserIdRef.current) {
            return;
          }

          setTypingUsers(prev => ({
            ...prev,
            [payload.senderId]: payload.isTyping,
          }));

          const existingTimer = typingExpiryRef.current.get(payload.senderId);
          if (existingTimer) {
            window.clearTimeout(existingTimer);
          }

          if (payload.isTyping) {
            const timerId = window.setTimeout(() => {
              setTypingUsers(prev => ({ ...prev, [payload.senderId]: false }));
              typingExpiryRef.current.delete(payload.senderId);
            }, 1800);

            typingExpiryRef.current.set(payload.senderId, timerId);
          } else {
            typingExpiryRef.current.delete(payload.senderId);
          }
        }
      } catch (err) {
        console.error("Chat socket payload error:", err);
      }
    });

    return () => {
      socket.close();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshSidebar().catch(() => undefined);

      if (!socketConnectedRef.current && selectedUserIdRef.current) {
        void loadMessages(selectedUserIdRef.current, { silent: true, markRead: true }).catch(() => undefined);
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (!open || !selectedUserId) {
      return;
    }

    void loadMessages(selectedUserId).catch(err => {
      toast({
        title: "Conversation unavailable",
        description: err instanceof Error ? err.message : "Unable to load messages.",
        variant: "destructive",
      });
    });
  }, [open, selectedUserId, toast]);

  const mergedContacts = useMemo(() => {
    const conversationMap = new Map(conversations.map(conversation => [conversation.id, conversation]));
    const merged = users.map(user => ({
      ...user,
      ...(conversationMap.get(user.id) || {}),
      online: user.online || conversationMap.get(user.id)?.online || false,
    }));

    for (const conversation of conversations) {
      if (!merged.some(user => user.id === conversation.id)) {
        merged.push(conversation);
      }
    }

    return merged.sort((left, right) => {
      const leftHasConversation = left.last_message_at ? 1 : 0;
      const rightHasConversation = right.last_message_at ? 1 : 0;

      if (leftHasConversation !== rightHasConversation) {
        return rightHasConversation - leftHasConversation;
      }

      if (left.last_message_at && right.last_message_at) {
        return new Date(right.last_message_at).getTime() - new Date(left.last_message_at).getTime();
      }

      if (left.online !== right.online) {
        return left.online ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
  }, [users, conversations]);

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return mergedContacts;
    }

    return mergedContacts.filter(contact =>
      [contact.name, contact.email, contact.role]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(term))
    );
  }, [mergedContacts, search]);

  const selectedUser = useMemo(
    () => mergedContacts.find(contact => contact.id === selectedUserId) || null,
    [mergedContacts, selectedUserId]
  );

  const isSelectedUserTyping = Boolean(selectedUserId && typingUsers[selectedUserId]);

  const emitTyping = (isTyping: boolean) => {
    if (!selectedUserIdRef.current || !socketRef.current || socketRef.current.readyState !== 1) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "chat:typing",
        recipientId: selectedUserIdRef.current,
        isTyping,
      })
    );
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);

    if (!selectedUserId) {
      return;
    }

    clearTypingTimer();

    if (!value.trim()) {
      emitTyping(false);
      return;
    }

    emitTyping(true);
    typingTimerRef.current = window.setTimeout(() => {
      emitTyping(false);
      typingTimerRef.current = null;
    }, 1200);
  };

  const handleStartEditingMessage = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setDraft(message.message);
  };

  const handleCancelEditingMessage = () => {
    setEditingMessageId(null);
    setDraft("");
    emitTyping(false);
    clearTypingTimer();
  };

  const handleSubmitMessage = async () => {
    if (!selectedUserId || !draft.trim()) {
      return;
    }

    setSending(true);

    try {
      const payload = editingMessageId
        ? await fetchJson<{ message: ChatMessage }>(`${API_URL}/api/chat/messages/${editingMessageId}`, {
            method: "PATCH",
            body: JSON.stringify({ message: draft }),
          })
        : await fetchJson<{ message: ChatMessage }>(`${API_URL}/api/chat/messages`, {
            method: "POST",
            body: JSON.stringify({
              recipient_id: selectedUserId,
              message: draft,
            }),
          });

      setMessages(prev => upsertMessage(prev, payload.message));
      setDraft("");
      setEditingMessageId(null);
      emitTyping(false);
      clearTypingTimer();

      await loadConversations();
    } catch (err) {
      toast({
        title: editingMessageId ? "Message not updated" : "Message not sent",
        description: err instanceof Error
          ? err.message
          : editingMessageId
            ? "Unable to save that change."
            : "Unable to deliver that message.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (message: ChatMessage) => {
    const confirmed = window.confirm("Delete this message for both users?");
    if (!confirmed) {
      return;
    }

    try {
      await fetchJson<{ deletedId: number }>(`${API_URL}/api/chat/messages/${message.id}`, {
        method: "DELETE",
      });

      setMessages(prev => removeMessageById(prev, message.id));

      if (editingMessageId === message.id) {
        handleCancelEditingMessage();
      }

      await loadConversations();
    } catch (err) {
      toast({
        title: "Message not deleted",
        description: err instanceof Error ? err.message : "Unable to delete that message.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmitMessage();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-slate-200 p-0 sm:max-w-6xl dark:border-slate-800"
      >
        <div className="flex h-full min-h-screen flex-col bg-slate-950 text-slate-50 sm:min-h-0">
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.28),_transparent_34%),linear-gradient(135deg,_#0f172a,_#020617)] px-6 py-5">
            <SheetHeader className="space-y-2 text-left">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <SheetTitle className="flex items-center gap-2 text-white">
                    <MessageSquareText className="h-5 w-5 text-cyan-300" />
                    Team Chat
                  </SheetTitle>
                  <SheetDescription className="text-slate-300">
                    Real-time conversations between account users and administrators.
                  </SheetDescription>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold",
                    socketConnected ? "text-emerald-300" : "text-amber-300"
                  )}
                >
                  {socketConnected ? (
                    <SignalHigh className="mr-2 h-3.5 w-3.5" />
                  ) : (
                    <Signal className="mr-2 h-3.5 w-3.5" />
                  )}
                  {socketConnected ? "Live" : "Reconnecting"}
                </Badge>
              </div>
            </SheetHeader>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center gap-3 text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading chat workspace...
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <aside className="flex w-full flex-col border-b border-white/10 bg-slate-900/70 lg:w-[340px] lg:border-b-0 lg:border-r">
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <Input
                      value={search}
                      onChange={event => setSearch(event.target.value)}
                      placeholder="Search users or roles"
                      className="border-0 bg-transparent p-0 text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-xs uppercase tracking-[0.3em] text-slate-400">
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    Contacts
                  </span>
                  <span>{filteredContacts.length}</span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {filteredContacts.length === 0 ? (
                    <div className="px-5 py-8 text-sm text-slate-400">
                      No users match that search.
                    </div>
                  ) : (
                    filteredContacts.map(contact => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => setSelectedUserId(contact.id)}
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-white/5 px-5 py-4 text-left transition-colors",
                          selectedUserId === contact.id
                            ? "bg-cyan-500/10"
                            : "hover:bg-white/5"
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-11 w-11 border border-white/10">
                            <AvatarImage src={resolveMediaUrl(contact.profile_picture)} alt={contact.name} />
                            <AvatarFallback className="bg-slate-800 text-slate-100">
                              {getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950",
                              contact.online ? "bg-emerald-400" : "bg-slate-500"
                            )}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-white">{contact.name}</p>
                            <span className="shrink-0 text-[11px] text-slate-400">
                              {formatConversationTime(contact.last_message_at)}
                            </span>
                          </div>
                          <p className="truncate text-xs uppercase tracking-[0.2em] text-slate-500">
                            {contact.role}
                          </p>
                          <p className="mt-1 truncate text-sm text-slate-300">
                            {contact.last_message || "Start a new conversation"}
                          </p>
                        </div>

                        {(contact.unread_count || 0) > 0 && (
                          <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-[11px] font-bold text-slate-950">
                            {contact.unread_count}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </aside>

              <section className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,1))]">
                {selectedUser ? (
                  <>
                    <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-white/10">
                          <AvatarImage src={resolveMediaUrl(selectedUser.profile_picture)} alt={selectedUser.name} />
                          <AvatarFallback className="bg-slate-800 text-slate-100">
                            {getInitials(selectedUser.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="text-base font-semibold text-white">{selectedUser.name}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                selectedUser.online ? "bg-emerald-400" : "bg-slate-500"
                              )}
                            />
                            {selectedUser.online ? "Online now" : "Offline"}
                          </div>
                        </div>
                      </div>

                      <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
                        {selectedUser.role}
                      </Badge>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                      {messageLoading ? (
                        <div className="flex h-full items-center justify-center gap-3 text-slate-400">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Loading conversation...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                          <MessageSquareText className="mb-3 h-10 w-10 text-slate-600" />
                          <p className="text-lg font-semibold text-slate-200">No messages yet</p>
                          <p className="mt-1 max-w-sm text-sm">
                            Start the thread with {selectedUser.name} and new replies will arrive here instantly.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map(message => {
                            const mine = message.sender_id === currentUser?.id;
                            const wasEdited = Boolean(message.updated_at && message.updated_at !== message.created_at);

                            return (
                              <div
                                key={message.id}
                                className={cn(
                                  "group flex",
                                  mine ? "justify-end" : "justify-start"
                                )}
                              >
                                <div
                                  className={cn("flex max-w-[82%] flex-col gap-2", mine ? "items-end" : "items-start")}
                                >
                                  <div
                                    className={cn(
                                      "rounded-3xl px-4 py-3 shadow-lg shadow-black/10",
                                      mine
                                        ? "rounded-br-md bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950"
                                        : "rounded-bl-md bg-white/8 text-slate-100 backdrop-blur"
                                    )}
                                  >
                                    <p className="whitespace-pre-wrap text-sm leading-6">{message.message}</p>
                                    <div
                                      className={cn(
                                        "mt-2 flex items-center gap-2 text-[11px]",
                                        mine ? "text-slate-900/80" : "text-slate-400"
                                      )}
                                    >
                                      <span>{formatMessageTime(message.created_at)}</span>
                                      {wasEdited && <span>Edited</span>}
                                      {mine && (
                                        <span className="inline-flex items-center gap-1">
                                          <SendHorizonal className="h-3 w-3" />
                                          {message.is_read ? "Seen" : "Sent"}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {mine && (
                                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleStartEditingMessage(message)}
                                        className="h-8 rounded-xl bg-white/5 px-3 text-slate-300 hover:bg-white/10 hover:text-white"
                                      >
                                        <Pencil className="mr-2 h-3.5 w-3.5" />
                                        Edit
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => void handleDeleteMessage(message)}
                                        className="h-8 rounded-xl bg-rose-500/10 px-3 text-rose-200 hover:bg-rose-500/20 hover:text-white"
                                      >
                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                        Delete
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {isSelectedUserTyping && (
                            <div className="flex justify-start">
                              <div className="rounded-3xl rounded-bl-md bg-white/8 px-4 py-3 text-sm text-slate-300">
                                {selectedUser.name} is typing...
                              </div>
                            </div>
                          )}

                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/10 bg-slate-950/80 px-6 py-4">
                      <div className="rounded-[28px] border border-white/10 bg-white/5 p-3 backdrop-blur">
                        {editingMessageId && (
                          <div className="mb-3 flex items-center justify-between rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                            <span>Editing your sent message</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEditingMessage}
                              className="h-8 rounded-xl px-3 text-cyan-100 hover:bg-cyan-400/10 hover:text-white"
                            >
                              <X className="mr-2 h-3.5 w-3.5" />
                              Cancel
                            </Button>
                          </div>
                        )}

                        <Textarea
                          value={draft}
                          onChange={event => handleDraftChange(event.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={editingMessageId ? "Update your message..." : `Message ${selectedUser.name}...`}
                          className="min-h-[92px] resize-none border-0 bg-transparent px-0 text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
                        />

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs text-slate-500">
                            {editingMessageId
                              ? "Press Enter to save. Use Shift + Enter for a new line."
                              : "Press Enter to send. Use Shift + Enter for a new line."}
                          </p>

                          <div className="flex items-center gap-2">
                            {editingMessageId && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={handleCancelEditingMessage}
                                className="rounded-2xl border border-white/10 px-4 text-slate-200 hover:bg-white/5 hover:text-white"
                              >
                                Cancel
                              </Button>
                            )}

                            <Button
                              onClick={() => void handleSubmitMessage()}
                              disabled={sending || !draft.trim() || !selectedUserId}
                              className="rounded-2xl bg-cyan-400 px-5 text-slate-950 hover:bg-cyan-300"
                            >
                              {sending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : editingMessageId ? (
                                <Check className="mr-2 h-4 w-4" />
                              ) : (
                                <SendHorizonal className="mr-2 h-4 w-4" />
                              )}
                              {editingMessageId ? "Save" : "Send"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-slate-400">
                    <Users className="mb-3 h-10 w-10 text-slate-600" />
                    <p className="text-lg font-semibold text-slate-200">Select a user to begin</p>
                    <p className="mt-1 max-w-md text-sm">
                      This panel supports live delivery, read status, and presence updates over the backend chat API.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
