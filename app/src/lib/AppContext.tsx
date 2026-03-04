import { createContext, useContext } from "react";
import type { AppSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings";

interface AppContextValue {
  settings: AppSettings;
  settingsLoaded: boolean;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

export const AppContext = createContext<AppContextValue>({
  settings: DEFAULT_SETTINGS,
  settingsLoaded: false,
  updateSettings: async () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}
