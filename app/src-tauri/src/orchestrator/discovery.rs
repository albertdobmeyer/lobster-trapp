use std::path::{Path, PathBuf};
use super::error::OrchestratorError;
use super::manifest::Manifest;

/// Discovered component: parsed manifest + its filesystem location
#[derive(Debug, Clone, serde::Serialize)]
pub struct DiscoveredComponent {
    pub manifest: Manifest,
    pub component_dir: String,
}

/// Discover all component.yml manifests under the components/ directory
pub fn discover_components(monorepo_root: &Path) -> Result<Vec<DiscoveredComponent>, OrchestratorError> {
    let components_dir = monorepo_root.join("components");
    if !components_dir.exists() {
        return Ok(Vec::new());
    }

    let pattern = components_dir
        .join("*")
        .join("component.yml")
        .to_string_lossy()
        .replace('\\', "/");

    let mut components = Vec::new();

    for entry in glob::glob(&pattern).map_err(|e| {
        OrchestratorError::ManifestParseError {
            path: pattern.clone(),
            message: e.to_string(),
        }
    })? {
        let path = entry.map_err(|e| OrchestratorError::IoError(e.into_error()))?;
        match parse_manifest(&path) {
            Ok(manifest) => {
                let component_dir = path
                    .parent()
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .replace('\\', "/");
                components.push(DiscoveredComponent {
                    manifest,
                    component_dir,
                });
            }
            Err(e) => {
                eprintln!("Warning: Failed to parse {}: {}", path.display(), e);
            }
        }
    }

    // Sort by identity.id for stable ordering
    components.sort_by(|a, b| a.manifest.identity.id.cmp(&b.manifest.identity.id));

    Ok(components)
}

fn parse_manifest(path: &PathBuf) -> Result<Manifest, OrchestratorError> {
    let content = std::fs::read_to_string(path)?;
    serde_yaml::from_str(&content).map_err(|e| OrchestratorError::ManifestParseError {
        path: path.to_string_lossy().to_string(),
        message: e.to_string(),
    })
}
