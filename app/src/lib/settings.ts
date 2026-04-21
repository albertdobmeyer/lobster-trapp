export type AppMode = "user" | "developer";

export interface NotificationSettings {
  securityAlerts: boolean;
  spendingLimit: boolean;
  updates: boolean;
}

export interface SpendingLimitSettings {
  /** Monthly limit in cents, or null for no limit. */
  monthly: number | null;
  /** Fractional threshold at which to alert (e.g. 0.8 = 80%). */
  alertThreshold: number;
}

export interface AppSettings {
  monorepoPathOverride: string | null;
  autoRefreshInterval: number;
  wizardCompleted: boolean;
  lastViewedComponentId: string | null;
  mode: AppMode;
  hasSeenAdvancedModeIntro: boolean;
  autostart: boolean;
  notifications: NotificationSettings;
  spendingLimit: SpendingLimitSettings;
  theme: "dark";
  minimizeToTray: boolean;
  closeToTray: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  monorepoPathOverride: null,
  autoRefreshInterval: 10000,
  wizardCompleted: false,
  lastViewedComponentId: null,
  mode: "user",
  hasSeenAdvancedModeIntro: false,
  autostart: true,
  notifications: {
    securityAlerts: true,
    spendingLimit: true,
    updates: true,
  },
  spendingLimit: {
    monthly: 2000,
    alertThreshold: 0.8,
  },
  theme: "dark",
  minimizeToTray: false,
  closeToTray: true,
};
