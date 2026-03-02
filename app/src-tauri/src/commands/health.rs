use std::path::PathBuf;
use tauri::State;

use crate::orchestrator::error::OrchestratorError;
use crate::orchestrator::runner;
use crate::orchestrator::state::AppState;

#[derive(serde::Serialize)]
pub struct HealthResult {
    pub probe_id: String,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

#[tauri::command]
pub async fn run_health_probe(
    state: State<'_, AppState>,
    component_id: String,
    probe_command: String,
    timeout_seconds: u64,
) -> Result<HealthResult, OrchestratorError> {
    let component_dir = {
        let components = state.components.lock().unwrap();
        let component = components
            .iter()
            .find(|c| c.manifest.identity.id == component_id)
            .ok_or_else(|| OrchestratorError::ComponentNotFound(component_id.clone()))?;
        component.component_dir.clone()
    };

    let result = runner::run_shell(
        &probe_command,
        &PathBuf::from(&component_dir),
        timeout_seconds,
    )
    .await?;

    Ok(HealthResult {
        probe_id: component_id,
        stdout: result.stdout,
        stderr: result.stderr,
        exit_code: result.exit_code,
    })
}
