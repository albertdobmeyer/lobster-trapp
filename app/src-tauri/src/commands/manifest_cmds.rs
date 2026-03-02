use tauri::State;
use crate::orchestrator::discovery::{discover_components, DiscoveredComponent};
use crate::orchestrator::error::OrchestratorError;
use crate::orchestrator::state::AppState;

#[tauri::command]
pub async fn list_components(
    state: State<'_, AppState>,
) -> Result<Vec<DiscoveredComponent>, OrchestratorError> {
    let discovered = discover_components(&state.monorepo_root)?;

    // Update cached components
    let mut components = state.components.lock().unwrap();
    *components = discovered.clone();

    Ok(discovered)
}

#[tauri::command]
pub async fn get_component(
    state: State<'_, AppState>,
    component_id: String,
) -> Result<DiscoveredComponent, OrchestratorError> {
    let components = state.components.lock().unwrap();

    components
        .iter()
        .find(|c| c.manifest.identity.id == component_id)
        .cloned()
        .ok_or_else(|| OrchestratorError::ComponentNotFound(component_id))
}
