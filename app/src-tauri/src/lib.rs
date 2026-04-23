mod commands;
mod orchestrator;
mod util;

use orchestrator::state::AppState;
use std::path::PathBuf;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

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
    let app_state = AppState::new(monorepo_root);

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
        .setup(|app| {
            setup_tray(app)?;
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
