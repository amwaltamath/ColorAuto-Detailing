import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderType: 'visitor' | 'employee' | 'admin';
  senderName?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatSession {
  id: string;
  visitorEmail?: string;
  visitorPhone?: string;
  visitorName?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface ChatStore {
  sessionId: string | null;
  messages: ChatMessage[];
  currentSession: ChatSession | null;
  isOpen: boolean;
  isLoading: boolean;
  unreadCount: number;

  // Actions
  initializeSession: (sessionId: string) => void;
  setSessionId: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  toggleChat: () => void;
  setIsLoading: (loading: boolean) => void;
  setUnreadCount: (count: number) => void;
  markMessagesAsRead: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessionId: null,
  messages: [],
  currentSession: null,
  isOpen: false,
  isLoading: false,
  unreadCount: 0,

  initializeSession: (sessionId: string) => {
    set({ sessionId });
    // Generate a unique session ID if needed (via UUID in browser)
    if (!sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      set({ sessionId: newSessionId });
    }
  },

  setSessionId: (id: string) => set({ sessionId: id }),

  addMessage: (message: ChatMessage | null) => {
    if (!message) return;
    set((state) => ({
      messages: [...state.messages, message],
      unreadCount: message.senderType !== 'visitor' ? state.unreadCount + 1 : state.unreadCount,
    }));
  },

  setMessages: (messages: ChatMessage[]) => {
    const unreadCount = messages.filter((m) => !m.isRead && m.senderType !== 'visitor').length;
    set({ messages, unreadCount });
  },

  setCurrentSession: (session: ChatSession | null) => set({ currentSession: session }),

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  setIsLoading: (loading: boolean) => set({ isLoading: loading }),

  setUnreadCount: (count: number) => set({ unreadCount: count }),

  markMessagesAsRead: () => {
    set((state) => ({
      messages: state.messages.map((m) => ({ ...m, isRead: true })),
      unreadCount: 0,
    }));
  },
}));
