export interface AppSettings {
  monorepoPathOverride: string | null;
  autoRefreshInterval: number;
  wizardCompleted: boolean;
  lastViewedComponentId: string | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  monorepoPathOverride: null,
  autoRefreshInterval: 10000,
  wizardCompleted: false,
  lastViewedComponentId: null,
};
