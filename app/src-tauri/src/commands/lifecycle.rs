//! Frontend-facing perimeter lifecycle commands.
//!
//! Pass 4 ships `get_perimeter_state` so the (Pass-6) Home rebuild has a
//! live data source for the 6-state hero machine. The state itself is
//! computed by the watchdog in `crate::lifecycle` and cached in
//! `PerimeterStateStore`.

use tauri::State;

use crate::lifecycle::{PerimeterStateStore, PerimeterStatus};

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
