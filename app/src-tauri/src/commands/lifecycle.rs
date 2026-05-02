//! Frontend-facing perimeter lifecycle commands.
//!
//! Pass 4 shipped `get_perimeter_state` so the Pass-6 Home rebuild has a
//! live data source for the hero machine. Pass 7 Day 3 adds
//! `restart_perimeter` so a key rotation in Preferences automatically
//! cycles vault-agent (which only reads `.env` on boot) without making
//! Karen reach for a terminal or manually relaunch.

use std::time::Duration;

use tauri::State;

use crate::lifecycle::{
    bring_perimeter_down_sync, run_compose, PerimeterStateStore, PerimeterStatus,
};
use crate::orchestrator::state::AppState;

/// Up budget for the restart cycle. Down has its own internal 30s
/// budget inside `bring_perimeter_down_sync`. Up takes ~5–10s when
/// images are already cached; 60s is generous headroom for slower
/// laptops without hanging the UI indefinitely on a stuck restart.
const RESTART_UP_BUDGET: Duration = Duration::from_secs(60);

/// Read the latest cached perimeter state. Returns immediately — does not
/// trigger a fresh probe (the watchdog runs every 30s in the background).
/// If the watchdog hasn't ticked yet, `last_checked_unix_ms` will be 0.
#[tauri::command]
pub fn get_perimeter_state(
    store: State<'_, PerimeterStateStore>,
) -> Result<PerimeterStatus, String> {
    store
        .0
        .lock()
        .map(|guard| guard.clone())
        .map_err(|e| format!("perimeter state lock poisoned: {e}"))
}

/// Cycle the perimeter (down + up). Synchronous from the caller's
/// perspective — awaits both phases before returning so the frontend
/// can show "Restarting…" → "Your assistant is back online" with
/// accurate timing. Compose work runs on a blocking task so the tokio
/// reactor doesn't stall on the ~10–20s typical restart.
///
/// Returns Err with a friendly message when the up step fails — most
/// likely cause is a malformed key the user just saved (vault-agent
/// rejects it on boot). The user's previous keys remain on disk so
/// they can fix and retry.
#[tauri::command]
pub async fn restart_perimeter(state: State<'_, AppState>) -> Result<(), String> {
    let root = state
        .monorepo_root
        .read()
        .map(|g| g.clone())
        .map_err(|e| format!("monorepo root lock poisoned: {e}"))?;

    let result = tokio::task::spawn_blocking(move || {
        bring_perimeter_down_sync(&root);
        run_compose(&root, &["up", "-d"], RESTART_UP_BUDGET)
    })
    .await
    .map_err(|e| format!("restart task join failed: {e}"))?;

    if !result {
        return Err(
            "Couldn't bring your assistant back up. Check the key you just saved \
             and try again."
                .to_string(),
        );
    }

    Ok(())
}
