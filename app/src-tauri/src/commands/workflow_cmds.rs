use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;

use crate::orchestrator::error::OrchestratorError;
use crate::orchestrator::manifest::Workflow;
use crate::orchestrator::state::AppState;
use crate::orchestrator::workflow::{self, WorkflowResult};

/// List all workflows for a component
#[tauri::command]
pub async fn list_workflows(
    state: State<'_, AppState>,
    component_id: String,
) -> Result<Vec<Workflow>, OrchestratorError> {
    let components = state.components.lock().unwrap();
    let component = components
        .iter()
        .find(|c| c.manifest.identity.id == component_id)
        .ok_or_else(|| OrchestratorError::ComponentNotFound(component_id.clone()))?;

    Ok(component.manifest.workflows.clone())
}

/// Execute a workflow by ID
#[tauri::command]
pub async fn execute_workflow(
    state: State<'_, AppState>,
    component_id: String,
    workflow_id: String,
    inputs: HashMap<String, String>,
) -> Result<WorkflowResult, OrchestratorError> {
    let (wf, commands, component_dir) = {
        let components = state.components.lock().unwrap();
        let component = components
            .iter()
            .find(|c| c.manifest.identity.id == component_id)
            .ok_or_else(|| OrchestratorError::ComponentNotFound(component_id.clone()))?;

        let wf = component
            .manifest
            .workflows
            .iter()
            .find(|w| w.id == workflow_id)
            .ok_or_else(|| OrchestratorError::WorkflowNotFound {
                component: component_id.clone(),
                workflow: workflow_id.clone(),
            })?
            .clone();

        (
            wf,
            component.manifest.commands.clone(),
            component.component_dir.clone(),
        )
    };

    workflow::execute_workflow(
        &wf,
        &commands,
        &PathBuf::from(&component_dir),
        &inputs,
    )
    .await
}
