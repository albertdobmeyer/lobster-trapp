use std::path::PathBuf;
use tauri::State;

use crate::orchestrator::error::OrchestratorError;
use crate::orchestrator::state::AppState;

#[tauri::command]
pub async fn read_config(
    state: State<'_, AppState>,
    component_id: String,
    config_path: String,
) -> Result<String, OrchestratorError> {
    let component_dir = {
        let components = state.components.lock().unwrap();
        let component = components
            .iter()
            .find(|c| c.manifest.identity.id == component_id)
            .ok_or_else(|| OrchestratorError::ComponentNotFound(component_id.clone()))?;
        component.component_dir.clone()
    };

    let full_path = PathBuf::from(&component_dir).join(&config_path);

    if !full_path.exists() {
        return Ok(String::new());
    }

    // Security: ensure path doesn't escape component directory
    let canonical_dir = PathBuf::from(&component_dir).canonicalize()
        .map_err(|e| OrchestratorError::ConfigNotFound(e.to_string()))?;
    let canonical_file = full_path.canonicalize()
        .map_err(|e| OrchestratorError::ConfigNotFound(e.to_string()))?;

    if !canonical_file.starts_with(&canonical_dir) {
        return Err(OrchestratorError::ConfigNotFound(
            "Path traversal detected".to_string(),
        ));
    }

    // Use canonical path to prevent TOCTOU symlink swaps
    std::fs::read_to_string(&canonical_file)
        .map_err(|e| OrchestratorError::ConfigNotFound(e.to_string()))
}

#[tauri::command]
pub async fn write_config(
    state: State<'_, AppState>,
    component_id: String,
    config_path: String,
    content: String,
) -> Result<(), OrchestratorError> {
    let component_dir = {
        let components = state.components.lock().unwrap();
        let component = components
            .iter()
            .find(|c| c.manifest.identity.id == component_id)
            .ok_or_else(|| OrchestratorError::ComponentNotFound(component_id.clone()))?;
        component.component_dir.clone()
    };

    let full_path = PathBuf::from(&component_dir).join(&config_path);

    // Security: ensure path doesn't escape component directory
    // For new files, check the parent directory
    let canonical_dir = PathBuf::from(&component_dir).canonicalize()
        .map_err(|e| OrchestratorError::ConfigWriteError(e.to_string()))?;

    // For existing files, canonicalize and verify
    if full_path.exists() {
        let canonical_file = full_path.canonicalize()
            .map_err(|e| OrchestratorError::ConfigWriteError(e.to_string()))?;
        if !canonical_file.starts_with(&canonical_dir) {
            return Err(OrchestratorError::ConfigWriteError(
                "Path traversal detected".to_string(),
            ));
        }
        // Use canonical path to prevent TOCTOU symlink swaps
        std::fs::write(&canonical_file, content)
            .map_err(|e| OrchestratorError::ConfigWriteError(e.to_string()))
    } else {
        // For new files, verify parent is within component dir
        if let Some(parent) = full_path.parent() {
            if parent.exists() {
                let canonical_parent = parent.canonicalize()
                    .map_err(|e| OrchestratorError::ConfigWriteError(e.to_string()))?;
                if !canonical_parent.starts_with(&canonical_dir) {
                    return Err(OrchestratorError::ConfigWriteError(
                        "Path traversal detected".to_string(),
                    ));
                }
            }
        }
        std::fs::write(&full_path, content)
            .map_err(|e| OrchestratorError::ConfigWriteError(e.to_string()))
    }
}
