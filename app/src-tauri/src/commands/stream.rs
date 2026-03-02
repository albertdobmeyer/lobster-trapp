use std::collections::HashMap;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;

use crate::orchestrator::error::OrchestratorError;
use crate::orchestrator::manifest::Command as ManifestCommand;
use crate::orchestrator::state::AppState;
use crate::util::shell::find_bash;

#[derive(Clone, serde::Serialize)]
struct StreamLine {
    component_id: String,
    command_id: String,
    line: String,
    stream: String, // "stdout" or "stderr"
}

#[derive(Clone, serde::Serialize)]
struct StreamEnd {
    component_id: String,
    command_id: String,
    exit_code: i32,
}

#[tauri::command]
pub async fn start_stream(
    app: AppHandle,
    state: State<'_, AppState>,
    component_id: String,
    command_id: String,
    args: HashMap<String, String>,
) -> Result<(), OrchestratorError> {
    let (manifest_cmd, component_dir) = {
        let components = state.components.lock().unwrap();
        let component = components
            .iter()
            .find(|c| c.manifest.identity.id == component_id)
            .ok_or_else(|| OrchestratorError::ComponentNotFound(component_id.clone()))?;

        let cmd = component
            .manifest
            .commands
            .iter()
            .find(|c| c.id == command_id)
            .ok_or_else(|| OrchestratorError::CommandNotFound {
                component: component_id.clone(),
                command: command_id.clone(),
            })?
            .clone();

        (cmd, component.component_dir.clone())
    };

    let bash = find_bash()
        .ok_or_else(|| OrchestratorError::ShellNotFound("bash not found".to_string()))?;

    // Kill any existing stream for this component:command before starting a new one
    {
        let key = format!("{}:{}", component_id, command_id);
        if let Some(old_pid) = state.active_streams.lock().unwrap().remove(&key) {
            #[cfg(target_os = "windows")]
            {
                let _ = std::process::Command::new("taskkill")
                    .args(["/PID", &old_pid.to_string(), "/T", "/F"])
                    .output();
            }
            #[cfg(not(target_os = "windows"))]
            {
                let _ = std::process::Command::new("kill")
                    .arg(old_pid.to_string())
                    .output();
            }
        }
    }

    let interpolated = interpolate_stream_args(&manifest_cmd, &args);

    let mut child = TokioCommand::new(&bash)
        .arg("-c")
        .arg(&interpolated)
        .current_dir(&component_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(OrchestratorError::IoError)?;

    // Store PID for stopping
    if let Some(pid) = child.id() {
        let key = format!("{}:{}", component_id, command_id);
        state.active_streams.lock().unwrap().insert(key, pid);
    }

    let cid = component_id.clone();
    let cmid = command_id.clone();

    // Spawn reader for stdout
    if let Some(stdout) = child.stdout.take() {
        let app_clone = app.clone();
        let cid_clone = cid.clone();
        let cmid_clone = cmid.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_clone.emit("stream-line", StreamLine {
                    component_id: cid_clone.clone(),
                    command_id: cmid_clone.clone(),
                    line,
                    stream: "stdout".to_string(),
                });
            }
        });
    }

    // Spawn reader for stderr
    if let Some(stderr) = child.stderr.take() {
        let app_clone = app.clone();
        let cid_clone = cid.clone();
        let cmid_clone = cmid.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_clone.emit("stream-line", StreamLine {
                    component_id: cid_clone.clone(),
                    command_id: cmid_clone.clone(),
                    line,
                    stream: "stderr".to_string(),
                });
            }
        });
    }

    // Wait for process to finish
    let cid_final = cid;
    let cmid_final = cmid;
    tokio::spawn(async move {
        let status = child.wait().await;
        let exit_code = status.map(|s| s.code().unwrap_or(-1)).unwrap_or(-1);
        let _ = app.emit("stream-end", StreamEnd {
            component_id: cid_final,
            command_id: cmid_final,
            exit_code,
        });
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_stream(
    state: State<'_, AppState>,
    component_id: String,
    command_id: String,
) -> Result<(), OrchestratorError> {
    let key = format!("{}:{}", component_id, command_id);
    let pid = {
        state.active_streams.lock().unwrap().remove(&key)
    };

    if let Some(pid) = pid {
        // Best-effort kill
        #[cfg(target_os = "windows")]
        {
            let _ = std::process::Command::new("taskkill")
                .args(["/PID", &pid.to_string(), "/T", "/F"])
                .output();
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = std::process::Command::new("kill")
                .arg(pid.to_string())
                .output();
        }
    }

    Ok(())
}

fn interpolate_stream_args(cmd: &ManifestCommand, args: &HashMap<String, String>) -> String {
    let mut result = cmd.command.clone();
    for (key, value) in args {
        let safe_value = format!("'{}'", value.replace('\'', "'\\''"));
        result = result.replace(&format!("${{{}}}", key), &safe_value);
    }
    result
}
