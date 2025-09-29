import { atom } from "jotai";

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
