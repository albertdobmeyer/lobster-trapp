//! Spending data — pulled live from the Anthropic Admin API.
//!
//! No estimation, no hardcoded prices. The user provides an optional
//! `sk-ant-admin-…` key (stored in `components/openclaw-vault/.env` as
//! `ANTHROPIC_ADMIN_API_KEY`). When present we hit
//! `/v1/organizations/cost_report` for the current month at daily
//! granularity. When absent we return `NotConnected` and the UI shows a
//! "Connect billing access" CTA + a Console deep-link as the always-
//! available escape hatch.
//!
//! Caching: a single in-memory entry with a 10-minute TTL. Anthropic
//! rate-limits the cost endpoint at 1 poll/minute and the data is itself
//! ~5 minutes delayed, so 10 minutes keeps us well inside both bounds and
//! avoids hammering the API on every Home mount.

use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use chrono::{Datelike, TimeZone, Utc};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::orchestrator::state::AppState;

const COST_REPORT_URL: &str = "https://api.anthropic.com/v1/organizations/cost_report";
const ANTHROPIC_VERSION: &str = "2023-06-01";
const CACHE_TTL: Duration = Duration::from_secs(600);
const HTTP_TIMEOUT: Duration = Duration::from_secs(10);

// ─── Public types ─────────────────────────────────────────────────────

/// Tagged union surfaced to the frontend. Snake-case matches Rust's
/// serde rename convention used elsewhere in the project (see
/// `lifecycle.rs`'s `PerimeterState`).
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum SpendingSummary {
    /// No `ANTHROPIC_ADMIN_API_KEY` in `.env` — show the "Connect
    /// billing access" CTA.
    NotConnected,
    /// Live data from Anthropic. Cents (USD).
    Connected {
        this_month_cents: u64,
        today_cents: u64,
        /// `Utc::now().timestamp_millis()` at fetch time. Lets the UI
        /// show "Updated 3 min ago" without a separate state field.
        last_fetched_unix_ms: i64,
    },
    /// Network or auth failure. UI falls back to the Console deep-link.
    /// `code` lets the UI distinguish "set up an org" (most common
    /// individual-account case) from a generic error.
    Error {
        code: SpendingErrorCode,
        message: String,
    },
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum SpendingErrorCode {
    /// 401/403 — admin key invalid or revoked.
    Unauthorized,
    /// Anthropic returned 404 with the "individual account" error body.
    /// Surfaced to the user as "Set up an organization on Anthropic
    /// Console" rather than a generic error.
    IndividualAccount,
    /// Network failure, timeout, or 5xx.
    Unreachable,
    /// Response shape didn't parse — should never happen but mapped to
    /// a friendly "couldn't read Anthropic's reply" message.
    ParseFailed,
}

// ─── Tauri-managed cache ──────────────────────────────────────────────

struct CacheEntry {
    summary: SpendingSummary,
    fetched_at: Instant,
}

pub struct SpendingCache(Mutex<Option<CacheEntry>>);

impl SpendingCache {
    pub fn new() -> Self {
        Self(Mutex::new(None))
    }
}

impl Default for SpendingCache {
    fn default() -> Self {
        Self::new()
    }
}

// ─── Tauri command ────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_spending_summary(
    state: State<'_, AppState>,
    cache: State<'_, SpendingCache>,
    force_refresh: Option<bool>,
) -> Result<SpendingSummary, String> {
    let force = force_refresh.unwrap_or(false);

    // Cache hit short-circuits the HTTP call entirely.
    if !force {
        if let Some(entry) = cache.0.lock().unwrap().as_ref() {
            if entry.fetched_at.elapsed() < CACHE_TTL {
                return Ok(entry.summary.clone());
            }
        }
    }

    let monorepo_root = state.monorepo_root.read().unwrap().clone();
    let env_path = monorepo_root
        .join("components")
        .join("openclaw-vault")
        .join(".env");

    let summary = match read_admin_key(&env_path) {
        None => SpendingSummary::NotConnected,
        Some(key) => fetch_summary(&key).await,
    };

    *cache.0.lock().unwrap() = Some(CacheEntry {
        summary: summary.clone(),
        fetched_at: Instant::now(),
    });

    Ok(summary)
}

// ─── .env reader ──────────────────────────────────────────────────────

/// Read `ANTHROPIC_ADMIN_API_KEY` from the vault `.env`. Mirrors the
/// frontend `parseEnvKeys` heuristic: skips empty values and any value
/// containing `REPLACE` (template placeholder convention).
fn read_admin_key(env_path: &PathBuf) -> Option<String> {
    let content = std::fs::read_to_string(env_path).ok()?;
    parse_admin_key(&content)
}

fn parse_admin_key(content: &str) -> Option<String> {
    for line in content.lines() {
        let line = line.trim();
        if line.starts_with('#') {
            continue;
        }
        let (key, value) = line.split_once('=')?;
        if key.trim() != "ANTHROPIC_ADMIN_API_KEY" {
            continue;
        }
        let v = value.trim().trim_matches(|c| c == '"' || c == '\'');
        if v.is_empty() || v.contains("REPLACE") {
            return None;
        }
        return Some(v.to_string());
    }
    None
}

// ─── HTTP client ──────────────────────────────────────────────────────

async fn fetch_summary(admin_key: &str) -> SpendingSummary {
    let now = Utc::now();
    let month_start = Utc
        .with_ymd_and_hms(now.year(), now.month(), 1, 0, 0, 0)
        .single();
    let month_start = match month_start {
        Some(t) => t,
        None => {
            return SpendingSummary::Error {
                code: SpendingErrorCode::ParseFailed,
                message: "Couldn't compute the start of the month.".to_string(),
            };
        }
    };
    let today_start_str = now.format("%Y-%m-%d").to_string();

    let client = match reqwest::Client::builder()
        .timeout(HTTP_TIMEOUT)
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return SpendingSummary::Error {
                code: SpendingErrorCode::Unreachable,
                message: format!("HTTP client init failed: {e}"),
            };
        }
    };

    let resp = client
        .get(COST_REPORT_URL)
        .header("x-api-key", admin_key)
        .header("anthropic-version", ANTHROPIC_VERSION)
        .query(&[
            ("starting_at", month_start.to_rfc3339()),
            ("ending_at", now.to_rfc3339()),
            ("bucket_width", "1d".to_string()),
        ])
        .send()
        .await;

    let resp = match resp {
        Ok(r) => r,
        Err(e) => {
            return SpendingSummary::Error {
                code: SpendingErrorCode::Unreachable,
                message: friendly_network_error(&e),
            };
        }
    };

    let status = resp.status();
    if !status.is_success() {
        let body_text = resp.text().await.unwrap_or_default();
        return SpendingSummary::Error {
            code: classify_http_status(status.as_u16(), &body_text),
            message: friendly_http_error(status.as_u16(), &body_text),
        };
    }

    let body_text = match resp.text().await {
        Ok(t) => t,
        Err(e) => {
            return SpendingSummary::Error {
                code: SpendingErrorCode::ParseFailed,
                message: format!("Couldn't read response body: {e}"),
            };
        }
    };

    match sum_cents(&body_text, &today_start_str) {
        Ok((this_month, today)) => SpendingSummary::Connected {
            this_month_cents: this_month,
            today_cents: today,
            last_fetched_unix_ms: now.timestamp_millis(),
        },
        Err(e) => SpendingSummary::Error {
            code: SpendingErrorCode::ParseFailed,
            message: e,
        },
    }
}

// ─── Response parsing ─────────────────────────────────────────────────

/// Walk the cost_report response shape defensively. The documented shape
/// is `{ data: [{ starting_at, results: [{ amount: "decimal-cents" }] }] }`
/// but Anthropic doesn't publish a literal example, so we keep the parser
/// tolerant: missing or unparseable values are treated as zero rather
/// than failing the whole call.
fn sum_cents(body: &str, today_prefix: &str) -> Result<(u64, u64), String> {
    let v: serde_json::Value =
        serde_json::from_str(body).map_err(|e| format!("Invalid JSON: {e}"))?;
    let data = v
        .get("data")
        .and_then(|d| d.as_array())
        .ok_or_else(|| "Response missing `data` array".to_string())?;

    let mut this_month: u64 = 0;
    let mut today: u64 = 0;

    for bucket in data {
        let bucket_start = bucket
            .get("starting_at")
            .and_then(|s| s.as_str())
            .unwrap_or("");
        let is_today = bucket_start.starts_with(today_prefix);

        let results = match bucket.get("results").and_then(|r| r.as_array()) {
            Some(r) => r,
            None => continue,
        };

        let bucket_total: u64 = results
            .iter()
            .filter_map(|r| r.get("amount").and_then(|a| a.as_str()))
            .filter_map(parse_cents)
            .sum();

        this_month = this_month.saturating_add(bucket_total);
        if is_today {
            today = today.saturating_add(bucket_total);
        }
    }

    Ok((this_month, today))
}

/// Anthropic returns USD costs as decimal strings in cents — e.g.
/// "342.50" is 342.50 cents, i.e. $3.4250. We round to the nearest whole
/// cent for display.
fn parse_cents(s: &str) -> Option<u64> {
    let f: f64 = s.trim().parse().ok()?;
    if f.is_nan() || f < 0.0 {
        return None;
    }
    Some(f.round() as u64)
}

// ─── Error classification ─────────────────────────────────────────────

fn classify_http_status(status: u16, body: &str) -> SpendingErrorCode {
    match status {
        401 | 403 => SpendingErrorCode::Unauthorized,
        404 => {
            // Anthropic surfaces "individual account" via 404 with a
            // specific error body. Match defensively on substring rather
            // than a brittle exact equality.
            let lower = body.to_ascii_lowercase();
            if lower.contains("individual account") || lower.contains("organization") {
                SpendingErrorCode::IndividualAccount
            } else {
                SpendingErrorCode::Unreachable
            }
        }
        _ => SpendingErrorCode::Unreachable,
    }
}

fn friendly_http_error(status: u16, _body: &str) -> String {
    match status {
        401 | 403 => "Anthropic didn't accept the billing key. It may have been revoked.".to_string(),
        404 => {
            "Anthropic doesn't expose spending data for individual accounts. \
             You can set up an organization (free) in the Anthropic Console."
                .to_string()
        }
        429 => "Anthropic asked us to slow down. We'll try again in a few minutes.".to_string(),
        500..=599 => "Anthropic is having trouble right now. We'll try again shortly.".to_string(),
        _ => format!("Anthropic returned an unexpected response (HTTP {status})."),
    }
}

fn friendly_network_error(e: &reqwest::Error) -> String {
    if e.is_timeout() {
        "Couldn't reach Anthropic in time. Check your connection.".to_string()
    } else if e.is_connect() {
        "Couldn't reach Anthropic. Check your connection.".to_string()
    } else {
        "Something went wrong reaching Anthropic.".to_string()
    }
}

// ─── Tests ────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_admin_key_from_env() {
        let env = "# header\nANTHROPIC_API_KEY=sk-ant-api03-foo\nANTHROPIC_ADMIN_API_KEY=sk-ant-admin-bar\nTELEGRAM_BOT_TOKEN=123:abc\n";
        assert_eq!(parse_admin_key(env), Some("sk-ant-admin-bar".to_string()));
    }

    #[test]
    fn parses_admin_key_with_quotes() {
        let env = "ANTHROPIC_ADMIN_API_KEY=\"sk-ant-admin-quoted\"\n";
        assert_eq!(
            parse_admin_key(env),
            Some("sk-ant-admin-quoted".to_string())
        );
    }

    #[test]
    fn skips_admin_key_placeholder() {
        let env = "ANTHROPIC_ADMIN_API_KEY=REPLACE_ME\n";
        assert_eq!(parse_admin_key(env), None);
    }

    #[test]
    fn skips_empty_admin_key() {
        let env = "ANTHROPIC_ADMIN_API_KEY=\n";
        assert_eq!(parse_admin_key(env), None);
    }

    #[test]
    fn skips_admin_key_in_comment() {
        let env = "# ANTHROPIC_ADMIN_API_KEY=sk-ant-admin-leaked\n";
        assert_eq!(parse_admin_key(env), None);
    }

    #[test]
    fn returns_none_when_admin_key_absent() {
        let env = "ANTHROPIC_API_KEY=sk-ant-api03-foo\n";
        assert_eq!(parse_admin_key(env), None);
    }

    #[test]
    fn parses_cents_decimal_string() {
        assert_eq!(parse_cents("342.50"), Some(343));
        assert_eq!(parse_cents("0"), Some(0));
        assert_eq!(parse_cents("100"), Some(100));
        assert_eq!(parse_cents("0.4"), Some(0));
        assert_eq!(parse_cents("0.6"), Some(1));
    }

    #[test]
    fn rejects_negative_or_garbage_amounts() {
        assert_eq!(parse_cents("-5"), None);
        assert_eq!(parse_cents("not-a-number"), None);
        assert_eq!(parse_cents(""), None);
    }

    #[test]
    fn sums_cents_across_buckets() {
        let body = r#"{
            "data": [
                {
                    "starting_at": "2026-04-01T00:00:00Z",
                    "results": [{"amount": "100"}, {"amount": "50"}]
                },
                {
                    "starting_at": "2026-04-30T00:00:00Z",
                    "results": [{"amount": "25"}]
                }
            ],
            "has_more": false
        }"#;
        let (this_month, today) = sum_cents(body, "2026-04-30").unwrap();
        assert_eq!(this_month, 175);
        assert_eq!(today, 25);
    }

    #[test]
    fn sum_cents_handles_empty_buckets() {
        let body = r#"{"data": []}"#;
        let (this_month, today) = sum_cents(body, "2026-04-30").unwrap();
        assert_eq!(this_month, 0);
        assert_eq!(today, 0);
    }

    #[test]
    fn sum_cents_tolerates_missing_results_array() {
        let body = r#"{
            "data": [{"starting_at": "2026-04-30T00:00:00Z"}]
        }"#;
        let (this_month, today) = sum_cents(body, "2026-04-30").unwrap();
        assert_eq!(this_month, 0);
        assert_eq!(today, 0);
    }

    #[test]
    fn sum_cents_rejects_missing_data_field() {
        let body = r#"{"foo": "bar"}"#;
        assert!(sum_cents(body, "2026-04-30").is_err());
    }

    #[test]
    fn classify_individual_account_404() {
        assert!(matches!(
            classify_http_status(404, "{\"error\": \"individual account not supported\"}"),
            SpendingErrorCode::IndividualAccount
        ));
        assert!(matches!(
            classify_http_status(401, "{}"),
            SpendingErrorCode::Unauthorized
        ));
        assert!(matches!(
            classify_http_status(500, "{}"),
            SpendingErrorCode::Unreachable
        ));
    }
}
