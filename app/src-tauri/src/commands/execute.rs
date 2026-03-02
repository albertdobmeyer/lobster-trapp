use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;

use crate::orchestrator::error::OrchestratorError;
use crate::orchestrator::runner::{self, CommandResult};
use crate::orchestrator::state::AppState;

#[tauri::command]
pub async fn run_command(
    state: State<'_, AppState>,
    component_id: String,
    command_id: String,
    args: HashMap<String, String>,
) -> Result<CommandResult, OrchestratorError> {
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

    runner::run_command(
        &manifest_cmd,
        &PathBuf::from(&component_dir),
        &args,
        manifest_cmd.timeout_seconds,
    )
    .await
}

#[tauri::command]
pub async fn load_options(
    state: State<'_, AppState>,
    component_id: String,
    command_string: String,
    timeout_seconds: u64,
) -> Result<Vec<String>, OrchestratorError> {
    let component_dir = {
        let components = state.components.lock().unwrap();
        let component = components
            .iter()
            .find(|c| c.manifest.identity.id == component_id)
            .ok_or_else(|| OrchestratorError::ComponentNotFound(component_id.clone()))?;
        component.component_dir.clone()
    };

    let result = runner::run_shell(
        &command_string,
        &PathBuf::from(&component_dir),
        timeout_seconds,
    )
    .await?;

    Ok(result
        .stdout
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect())
}
