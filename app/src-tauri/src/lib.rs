mod commands;
mod orchestrator;
mod util;

use orchestrator::state::AppState;
use std::path::{Path, PathBuf};
use std::process::Command as StdCommand;
use std::time::Duration;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

/// Redact known token-bearing environment variables from a stderr blob
/// before it's logged. `podman compose` echoes the full container-creation
/// command on failure, including `TELEGRAM_BOT_TOKEN=...` in cleartext —
/// which would leak into our log if surfaced verbatim. Mirrors the
/// vault-proxy redaction pattern from Finding #1 (project_decisions.md).
const REDACTED: &str = "<REDACTED>";

fn redact_secrets(s: &str) -> String {
    const SENSITIVE_VARS: &[&str] = &[
        "TELEGRAM_BOT_TOKEN",
        "ANTHROPIC_API_KEY",
        "OPENAI_API_KEY",
    ];
    let mut out = s.to_string();
    for var in SENSITIVE_VARS {
        let needle = format!("{var}=");
        let mut search_from = 0;
        while let Some(rel) = out[search_from..].find(&needle) {
            let pos = search_from + rel;
            let after = pos + needle.len();
            // Redact until the next whitespace, quote, or end-of-string.
            let end = out[after..]
                .find(|c: char| c.is_whitespace() || c == '"' || c == '\'')
                .map(|n| after + n)
                .unwrap_or(out.len());
            out.replace_range(after..end, REDACTED);
            // Advance past the redaction so we don't re-match the same `KEY=`.
            search_from = after + REDACTED.len();
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redacts_telegram_bot_token() {
        let input = "podman run -e TELEGRAM_BOT_TOKEN=12345:abcdef -e FOO=bar ...";
        let out = redact_secrets(input);
        assert!(!out.contains("12345:abcdef"));
        assert!(out.contains("TELEGRAM_BOT_TOKEN=<REDACTED>"));
        assert!(out.contains("FOO=bar"));
    }

    #[test]
    fn redacts_multiple_occurrences_without_looping() {
        let input = "ANTHROPIC_API_KEY=sk-ant-aaa OPENAI_API_KEY=sk-bbb";
        let out = redact_secrets(input);
        assert!(!out.contains("sk-ant-aaa"));
        assert!(!out.contains("sk-bbb"));
        assert!(out.matches(REDACTED).count() == 2);
    }

    #[test]
    fn passes_through_unrelated_text() {
        let input = "exit 137: SIGKILL received";
        assert_eq!(redact_secrets(input), input);
    }
}

/// Try `podman compose <args...>` first, then `docker compose <args...>`.
/// Returns true if either succeeded with a zero exit code. Intentionally
/// non-fatal — the app boots even if no container runtime is installed
/// yet (e.g. first launch before the wizard has run System Check).
///
/// `timeout` wraps the call with `timeout(1)` if that binary is on PATH;
/// otherwise the call runs without a wrapper and may hang indefinitely
/// (which is no worse than the pre-Pass-4 behavior of not running it at all).
fn run_compose(root: &Path, args: &[&str], timeout: Duration) -> bool {
    for runtime in &["podman", "docker"] {
        let secs = timeout.as_secs().max(1).to_string();

        // First attempt: wrap with timeout(1) for a hard ceiling.
        let wrapped = StdCommand::new("timeout")
            .args(["--signal=TERM", "--kill-after=5s", &secs, runtime, "compose"])
            .args(args)
            .current_dir(root)
            .output();

        let output = match wrapped {
            // ENOENT: timeout binary not on PATH. Fall back to direct call.
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => StdCommand::new(runtime)
                .arg("compose")
                .args(args)
                .current_dir(root)
                .output(),
            other => other,
        };

        match output {
            Ok(out) if out.status.success() => {
                eprintln!("[lifecycle] {} compose {} → ok", runtime, args.join(" "));
                return true;
            }
            Ok(out) => {
                let stderr = String::from_utf8_lossy(&out.stderr);
                eprintln!(
                    "[lifecycle] {} compose {} exited {}: {}",
                    runtime,
                    args.join(" "),
                    out.status,
                    redact_secrets(stderr.trim())
                );
                // Try the next runtime — maybe podman is broken on this host
                // and docker works.
            }
            Err(e) => {
                eprintln!(
                    "[lifecycle] failed to spawn {}: {} — trying next runtime",
                    runtime, e
                );
            }
        }
    }
    false
}

/// Bring the 4-container perimeter up. Idempotent — `compose up -d` is a
/// no-op when containers are already running. Spawned on a background
/// thread so the Tauri window appears immediately even if containers are
/// being built/pulled for the first time.
fn bring_perimeter_up_async(root: PathBuf) {
    std::thread::spawn(move || {
        // 90s budget for first-time pulls / image builds. On a warm cache
        // this returns in 1-3s.
        run_compose(&root, &["up", "-d"], Duration::from_secs(90));
    });
}

/// Tear the perimeter down on graceful exit. Synchronous — we want the
/// containers actually stopped before the process terminates so we don't
/// leak the cell block. 30s budget; if compose down stalls past that,
/// the timeout kicks in and the app exits anyway (P11: app dies → containers
/// die, even on a stuck shutdown).
fn bring_perimeter_down_sync(root: &Path) {
    run_compose(root, &["down"], Duration::from_secs(30));
}

/// Find the monorepo root by looking for a `components/` directory.
fn find_monorepo_root() -> PathBuf {
    // Strategy 1: Walk up from executable path
    // During cargo tauri dev: target/debug/lobster-trapp.exe
    //   -> 4 levels up to reach monorepo root (debug -> target -> src-tauri -> app -> root)
    if let Ok(exe) = std::env::current_exe() {
        let mut candidate = exe.as_path();
        for _ in 0..6 {
            if let Some(parent) = candidate.parent() {
                candidate = parent;
                if candidate.join("components").exists() {
                    return candidate.to_path_buf();
                }
            }
        }
    }

    // Strategy 2: Current working directory (common during dev)
    if let Ok(cwd) = std::env::current_dir() {
        // Check cwd itself and up to 3 parents
        let mut candidate = cwd.as_path().to_path_buf();
        for _ in 0..4 {
            if candidate.join("components").exists() {
                return candidate;
            }
            if let Some(parent) = candidate.parent() {
                candidate = parent.to_path_buf();
            } else {
                break;
            }
        }
    }

    // Strategy 3: Fallback to cwd
    std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
}

/// Build the system tray menu and register event handlers.
///
/// Minimum implementation for Phase E.1:
/// - Non-clickable status line (placeholder — real status wires in Phase E.2)
/// - Open Dashboard → shows/focuses the main window
/// - Quit → exits the app
///
/// Left-click on the tray icon brings the main window forward.
fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let status_item = MenuItem::with_id(
        app,
        "status",
        "Assistant status — initializing",
        false,
        None::<&str>,
    )?;
    let open_item = MenuItem::with_id(app, "open", "Open Dashboard", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit Lobster-TrApp", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(
        app,
        &[&status_item, &separator, &open_item, &separator, &quit_item],
    )?;

    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or_else(|| tauri::Error::AssetNotFound("default window icon".into()))?;

    TrayIconBuilder::with_id("main-tray")
        .tooltip("Lobster-TrApp")
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let monorepo_root = find_monorepo_root();
    let app_state = AppState::new(monorepo_root.clone());

    // Pass-4 sub-pass (lifecycle ownership, partial): the perimeter is now
    // bound to the app's lifetime. App start spawns `compose up -d`; graceful
    // exit runs `compose down`. RunGuard / signal handlers / watchdog land
    // in a follow-up sub-pass.
    let perimeter_root = monorepo_root.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(move |app| {
            setup_tray(app)?;
            // Spawn perimeter bring-up on a background thread so the UI
            // appears immediately even if a first-time pull is happening.
            bring_perimeter_up_async(perimeter_root.clone());
            Ok(())
        })
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::manifest_cmds::list_components,
            commands::manifest_cmds::get_component,
            commands::manifest_cmds::set_monorepo_root,
            commands::execute::run_command,
            commands::execute::load_options,
            commands::stream::start_stream,
            commands::stream::stop_stream,
            commands::config::read_config,
            commands::config::write_config,
            commands::status::get_status,
            commands::health::run_health_probe,
            commands::prerequisites::check_prerequisites,
            commands::prerequisites::init_submodules,
            commands::prerequisites::create_config_from_template,
            commands::workflow_cmds::list_workflows,
            commands::workflow_cmds::execute_workflow,
            commands::diagnostics::generate_diagnostic_bundle,
            commands::telegram::derive_telegram_bot_url,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(move |_app_handle, event| {
            // RunEvent::Exit fires once when the app is about to terminate
            // (after all windows are gone). Tear the perimeter down here so
            // app-close ⇒ perimeter-down (P11). Synchronous, with a 30s
            // ceiling enforced by run_compose's timeout wrapper.
            if let tauri::RunEvent::Exit = &event {
                bring_perimeter_down_sync(&monorepo_root);
            }
        });
}
