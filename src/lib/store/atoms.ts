import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { ChatSession } from "./chat-storage";

// Default selections based on fixture data (connected sources and selected channels)
const DEFAULT_SELECTED_SOURCES = ["website-pixel", "shopify", "twitter"];
const DEFAULT_SELECTED_CHANNELS = ["email", "sms", "whatsapp", "ads"];

// Atoms for global state management
export const selectedSourcesAtom = atom<string[]>(DEFAULT_SELECTED_SOURCES);
export const selectedChannelsAtom = atom<string[]>(DEFAULT_SELECTED_CHANNELS);

// Derived atoms for convenience
export const selectedSourcesCountAtom = atom(
  (get) => get(selectedSourcesAtom).length
);
export const selectedChannelsCountAtom = atom(
  (get) => get(selectedChannelsAtom).length
);

// Write-only atoms for toggling
export const toggleSourceAtom = atom(null, (get, set, sourceId: string) => {
  const current = get(selectedSourcesAtom);
  set(
    selectedSourcesAtom,
    current.includes(sourceId)
      ? current.filter((id) => id !== sourceId)
      : [...current, sourceId]
  );
});

export const toggleChannelAtom = atom(null, (get, set, channelId: string) => {
  const current = get(selectedChannelsAtom);
  set(
    selectedChannelsAtom,
    current.includes(channelId)
      ? current.filter((id) => id !== channelId)
      : [...current, channelId]
  );
});

// Chat history atoms with persistent storage
export const currentChatIdAtom = atom<string | null>(null);
export const chatSessionsAtom = atomWithStorage<ChatSession[]>(
  "markopolo-chat-history",
  []
);

// Constants for chat management
const MAX_STORED_CHATS = 49;

// Write-only atoms for chat management
export const addChatSessionAtom = atom(
  null,
  (get, set, session: ChatSession) => {
    const current = get(chatSessionsAtom);
    set(chatSessionsAtom, [session, ...current.slice(0, MAX_STORED_CHATS)]); // Keep latest 50 chats
  }
);

export const updateChatSessionAtom = atom(
  null,
  (get, set, session: ChatSession) => {
    const current = get(chatSessionsAtom);
    const index = current.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      const updated = [...current];
      updated[index] = session;
      set(chatSessionsAtom, updated);
    }
  }
);

export const deleteChatSessionAtom = atom(null, (get, set, chatId: string) => {
  const current = get(chatSessionsAtom);
  set(
    chatSessionsAtom,
    current.filter((s) => s.id !== chatId)
  );
});

// Atom to restore sources and channels from a chat session
export const restoreChatStateAtom = atom(
  null,
  (_get, set, session: ChatSession) => {
    set(selectedSourcesAtom, session.selectedSources);
    set(selectedChannelsAtom, session.selectedChannels);
    set(currentChatIdAtom, session.id);
  }
);
