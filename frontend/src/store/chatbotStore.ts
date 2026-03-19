import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatAttachment {
  id: string;
  type: 'image' | 'document' | 'pdf';
  name: string;
  url: string;       // object URL or base64 for preview
  size: number;
  mimeType: string;
}

export interface ChatPropertyListing {
  _id: string;
  title: string;
  price: number;
  status: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  address: { street: string; city: string; province: string };
  neighbourhood?: string;
  images: { url: string; isPrimary: boolean }[];
  daysOnMarket: number;
  slug: string;
}

export interface ChatOption {
  label: string;
  value: string;
  icon?: string;        // emoji or short string
  description?: string; // optional sub-label
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: ChatAttachment[];
  quickReplies?: string[];
  options?: ChatOption[];
  listings?: ChatPropertyListing[];   // real property cards
  isTyping?: boolean;
  metadata?: {
    type?: 'property_card' | 'stat_card' | 'lead_card' | 'info';
    data?: Record<string, unknown>;
  };
}

interface ChatbotState {
  sessionId: string;
  messages: ChatMessage[];
  isOpen: boolean;
  isMinimized: boolean;
  isTyping: boolean;
  unreadCount: number;

  // Actions
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  minimizeChat: () => void;
  restoreChat: () => void;
  addMessage: (message: ChatMessage) => void;
  setTyping: (typing: boolean) => void;
  clearMessages: () => void;
  markRead: () => void;
  incrementUnread: () => void;
}

const generateSessionId = () =>
  `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm **Nova**, your NuVista AI assistant. How can I help you today?",
  timestamp: Date.now(),
  options: [
    { icon: '📊', label: 'Market Statistics',      value: 'Show market stats',        description: 'GTA prices, trends & inventory' },
    { icon: '🏡', label: 'Property Listings',       value: 'Tell me about properties', description: 'Types, statuses & management' },
    { icon: '👥', label: 'Lead & CRM Management',   value: 'Tell me about leads',      description: 'Pipeline, scoring & follow-ups' },
    { icon: '💰', label: 'Pricing & Valuation',     value: 'Property pricing tips',    description: 'CMA strategy & best practices' },
    { icon: '🗺️', label: 'Neighbourhoods',          value: 'Best neighbourhoods',      description: 'GTA area guide with avg prices' },
    { icon: '🏦', label: 'Mortgage & Financing',    value: 'Mortgage info',            description: 'Rates, down payments & rules' },
    { icon: '🏷️', label: 'Selling Tips',            value: 'Selling tips',             description: 'Checklist to get top dollar' },
    { icon: '🔑', label: 'Buying Guide',            value: 'Buying guide',             description: 'Steps, offers & negotiations' },
  ],
};

export const useChatbotStore = create<ChatbotState>()(
  persist(
    (set) => ({
      sessionId: generateSessionId(),
      messages: [WELCOME_MESSAGE],
      isOpen: false,
      isMinimized: false,
      isTyping: false,
      unreadCount: 0,

      openChat: () =>
        set({ isOpen: true, isMinimized: false, unreadCount: 0 }),

      closeChat: () =>
        set({ isOpen: false, isMinimized: false }),

      toggleChat: () =>
        set((s) => ({
          isOpen: !s.isOpen,
          isMinimized: false,
          unreadCount: s.isOpen ? s.unreadCount : 0,
        })),

      minimizeChat: () =>
        set({ isMinimized: true }),

      restoreChat: () =>
        set({ isMinimized: false, unreadCount: 0 }),

      addMessage: (message) =>
        set((s) => ({ messages: [...s.messages, message] })),

      setTyping: (typing) => set({ isTyping: typing }),

      clearMessages: () =>
        set({
          messages: [{ ...WELCOME_MESSAGE, timestamp: Date.now() }],
          sessionId: generateSessionId(),
        }),

      markRead: () => set({ unreadCount: 0 }),

      incrementUnread: () =>
        set((s) => ({ unreadCount: s.unreadCount + 1 })),
    }),
    {
      name: 'nuvista-chat-session',
      // Only persist messages and session – not UI state
      partialize: (s) => ({
        sessionId: s.sessionId,
        messages: s.messages.slice(-100), // keep last 100
      }),
    }
  )
);
