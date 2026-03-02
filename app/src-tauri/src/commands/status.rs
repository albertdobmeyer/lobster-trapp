use std::path::PathBuf;
use tauri::State;

use crate::orchestrator::error::OrchestratorError;
use crate::orchestrator::runner;
use crate::orchestrator::state::AppState;

#[derive(serde::Serialize)]
pub struct ComponentStatus {
    pub component_id: String,
    pub state_id: String,
}

#[tauri::command]
pub async fn get_status(
    state: State<'_, AppState>,
    component_id: String,
) -> Result<ComponentStatus, OrchestratorError> {
    let (status_config, component_dir) = {
        let components = state.components.lock().unwrap();
        let component = components
            .iter()
            .find(|c| c.manifest.identity.id == component_id)
            .ok_or_else(|| OrchestratorError::ComponentNotFound(component_id.clone()))?;

        (
            component.manifest.status.clone(),
            component.component_dir.clone(),
        )
    };

    let status = match status_config {
        Some(status) => status,
        None => {
            return Ok(ComponentStatus {
                component_id,
                state_id: "unknown".to_string(),
            });
        }
    };

    let dir = PathBuf::from(&component_dir);

    // Run each probe and check rules
    for probe in &status.probes {
        let result = runner::run_shell(
            &probe.command,
            &dir,
            probe.timeout_seconds,
        )
        .await;

        if let Ok(result) = result {
            for rule in &probe.rules {
                let matches = match (&rule.exit_code, &rule.stdout_contains, &rule.stdout_regex) {
                    (Some(code), _, _) if result.exit_code == *code => true,
                    (_, Some(contains), _) if result.stdout.contains(contains.as_str()) => true,
                    (_, _, Some(pattern)) => {
                        regex_matches(&result.stdout, pattern)
                    }
                    _ => false,
                };

                if matches {
                    // Cache the state
                    state.component_states
                        .lock()
                        .unwrap()
                        .insert(component_id.clone(), rule.state.clone());

                    return Ok(ComponentStatus {
                        component_id,
                        state_id: rule.state.clone(),
                    });
                }
            }
        }
    }

    // No rule matched — use default
    let default = status.default_state.unwrap_or_else(|| "unknown".to_string());
    state.component_states
        .lock()
        .unwrap()
        .insert(component_id.clone(), default.clone());

    Ok(ComponentStatus {
        component_id,
        state_id: default,
    })
}

fn regex_matches(text: &str, pattern: &str) -> bool {
    match regex::Regex::new(pattern) {
        Ok(re) => re.is_match(text),
        Err(e) => {
            eprintln!("Invalid regex pattern '{}': {}", pattern, e);
            false
        }
    }
}
