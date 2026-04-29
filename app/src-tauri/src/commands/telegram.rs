//! Derive a Telegram deep-link from a bot token.
//!
//! The wizard's Ready screen wants to open Telegram directly to the user's
//! bot chat. To do that we need the bot's `@username`, which Telegram only
//! returns from `GET /bot{TOKEN}/getMe`. Calling that from the webview
//! would require relaxing `connect-src` in the CSP *and* leaking the token
//! into browser memory — both avoidable by making the call from Rust and
//! handing back a clean URL.

use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct TelegramResponse {
    ok: bool,
    result: Option<BotUser>,
    description: Option<String>,
}

#[derive(Deserialize)]
struct BotUser {
    username: Option<String>,
}

/// Resolved Telegram bot identity surfaced to the frontend. Both fields are
/// always populated together — they're derived from the same `getMe` call.
/// The frontend caches them so the Ready screen can either deep-link into
/// the bot chat (`url`) or, if the link doesn't auto-route into the right
/// chat, surface the `@username` for Karen to search manually.
#[derive(Serialize)]
pub struct TelegramBot {
    pub url: String,
    pub username: String,
}

/// Resolves a bot token into a `{url, username}` pair via Telegram's
/// `getMe` endpoint.
///
/// - `Err` on any failure (network, non-200, malformed JSON, missing username).
///   The frontend falls back to a generic Telegram link; no error is surfaced
///   to the user.
/// - Never returns a value containing the token.
#[tauri::command]
pub async fn derive_telegram_bot_url(token: String) -> Result<TelegramBot, String> {
    let token = token.trim();
    if token.is_empty() {
        return Err("Empty token".to_string());
    }

    let url = format!("https://api.telegram.org/bot{}/getMe", token);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Telegram API returned {}", resp.status()));
    }

    let body: TelegramResponse = resp
        .json()
        .await
        .map_err(|e| format!("Malformed response: {}", e))?;

    if !body.ok {
        return Err(body
            .description
            .unwrap_or_else(|| "Telegram rejected the token".to_string()));
    }

    let username = body
        .result
        .and_then(|u| u.username)
        .ok_or_else(|| "Response missing username".to_string())?;

    if username.is_empty() {
        return Err("Empty username".to_string());
    }

    Ok(TelegramBot {
        url: format!("https://t.me/{}?text=Hi", username),
        username,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn empty_token_errors() {
        let result = derive_telegram_bot_url(String::new()).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn whitespace_token_errors() {
        let result = derive_telegram_bot_url("   ".to_string()).await;
        assert!(result.is_err());
    }

    #[test]
    fn response_parses_happy_path() {
        let json = r#"{"ok":true,"result":{"id":1,"is_bot":true,"first_name":"Bot","username":"MyAssistantBot"}}"#;
        let parsed: TelegramResponse = serde_json::from_str(json).unwrap();
        assert!(parsed.ok);
        assert_eq!(
            parsed.result.and_then(|u| u.username).as_deref(),
            Some("MyAssistantBot")
        );
    }

    #[test]
    fn response_parses_error_path() {
        let json = r#"{"ok":false,"description":"Unauthorized"}"#;
        let parsed: TelegramResponse = serde_json::from_str(json).unwrap();
        assert!(!parsed.ok);
        assert_eq!(parsed.description.as_deref(), Some("Unauthorized"));
    }
}
