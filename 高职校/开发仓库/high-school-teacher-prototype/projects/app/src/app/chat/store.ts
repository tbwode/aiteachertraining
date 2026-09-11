import { create } from 'zustand';
import type { ChatSiteItemType } from '@fastgpt/global/core/chat/type';
import type { InitChatResponse, ChatHistoryItemType } from './types';

type Setter<T> = T | ((prev: T) => T);

function resolveSetter<T>(setter: Setter<T>, prev: T): T {
  return typeof setter === 'function' ? (setter as (prev: T) => T)(prev) : setter;
}

type ChatState = {
  chatHistory: ChatSiteItemType[];
  setChatHistory: (data: Setter<ChatSiteItemType[]>) => void;

  chatData: InitChatResponse | null;
  setChatData: (data: Setter<InitChatResponse | null>) => void;

  customTitle: string;
  setCustomTitle: (title: string) => void;

  histories: ChatHistoryItemType[];
  setHistories: (data: Setter<ChatHistoryItemType[]>) => void;

  generatingChatIds: string[];
  startGenerating: (chatId: string) => void;
  endGenerating: (chatId: string) => void;

  chatStoreCache: Record<string, ChatSiteItemType[]>;
  updateChatCache: (chatId: string, data: ChatSiteItemType[]) => void;
};

export const useHuayunChatStore = create<ChatState>((set, get) => ({
  chatHistory: [],
  setChatHistory: (data) =>
    set((state) => ({ chatHistory: resolveSetter(data, state.chatHistory) })),

  chatData: null,
  setChatData: (data) => set((state) => ({ chatData: resolveSetter(data, state.chatData) })),

  customTitle: '',
  setCustomTitle: (title) => set({ customTitle: title }),

  histories: [],
  setHistories: (data) =>
    set((state) => ({ histories: resolveSetter(data, state.histories) })),

  generatingChatIds: [],
  startGenerating: (chatId) => {
    const ids = get().generatingChatIds;
    if (!ids.includes(chatId)) {
      set({ generatingChatIds: [...ids, chatId] });
    }
  },
  endGenerating: (chatId) => {
    set({ generatingChatIds: get().generatingChatIds.filter((id) => id !== chatId) });
  },

  chatStoreCache: {},
  updateChatCache: (chatId, data) => {
    set({ chatStoreCache: { ...get().chatStoreCache, [chatId]: data } });
  }
}));
