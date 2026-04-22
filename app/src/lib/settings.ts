export type AppMode = "user" | "developer";

export type SetupStep = "welcome" | "connect" | "install" | "ready";

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

export interface SetupProgress {
  step: SetupStep;
  completedSteps: SetupStep[];
  /** Set when user dismissed the keys form via Skip — assistant stays paused until keys added. */
  skippedKeys?: boolean;
}

export interface DismissedAlerts {
  /** Per-session dismissals keyed by alert id with epoch ms of dismissal. */
  [alertId: string]: number;
}

export interface AppSettings {
  monorepoPathOverride: string | null;
  autoRefreshInterval: number;
  wizardCompleted: boolean;
  /** Resume token for the setup wizard. Null when not in progress. */
  setupProgress: SetupProgress | null;
  lastViewedComponentId: string | null;
  mode: AppMode;
  hasSeenAdvancedModeIntro: boolean;
  autostart: boolean;
  notifications: NotificationSettings;
  spendingLimit: SpendingLimitSettings;
  theme: "dark";
  minimizeToTray: boolean;
  closeToTray: boolean;
  /** Use-case ids the user has favourited on the Discover screen. */
  favoriteUseCaseIds: string[];
  /** Alert ids dismissed in the current Tauri-store generation. Cleared on app reinstall. */
  dismissedAlerts: DismissedAlerts;
}

export const DEFAULT_SETTINGS: AppSettings = {
  monorepoPathOverride: null,
  autoRefreshInterval: 10000,
  wizardCompleted: false,
  setupProgress: null,
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
  favoriteUseCaseIds: [],
  dismissedAlerts: {},
};
