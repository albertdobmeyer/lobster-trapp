use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use super::discovery::DiscoveredComponent;

/// Application state managed by Tauri
pub struct AppState {
    pub monorepo_root: PathBuf,
    pub components: Mutex<Vec<DiscoveredComponent>>,
    pub component_states: Mutex<HashMap<String, String>>,
    pub active_streams: Mutex<HashMap<String, u32>>, // component:command -> child PID
}

impl AppState {
    pub fn new(monorepo_root: PathBuf) -> Self {
        Self {
            monorepo_root,
            components: Mutex::new(Vec::new()),
            component_states: Mutex::new(HashMap::new()),
            active_streams: Mutex::new(HashMap::new()),
        }
    }
}
