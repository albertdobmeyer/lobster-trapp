mod commands;
mod orchestrator;
mod util;

use orchestrator::state::AppState;
use std::path::PathBuf;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let monorepo_root = find_monorepo_root();
    let app_state = AppState::new(monorepo_root);

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
