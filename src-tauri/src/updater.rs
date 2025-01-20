use crate::config::{get, set};
use crate::window::{updater_window, notify_window};
use log::{info, warn};

pub fn check_update(app_handle: tauri::AppHandle) {
    let enable = match get("check_update") {
        Some(v) => v.as_bool().unwrap(),
        None => {
            set("check_update", true);
            true
        }
    };
    if enable {
        tauri::async_runtime::spawn(async move {
            match tauri::updater::builder(app_handle).check().await {
                Ok(update) => {
                    if update.is_update_available() {
                        let should_show = match get("ignore_updater_version") {
                            Some(version) => {
                                version.as_str().unwrap() != update.latest_version()
                            }
                            None => true
                        };
                        info!("New version available");
                        if should_show {
                            info!("Show updater window");
                            updater_window();
                        }
                    }
                }
                Err(e) => {
                    warn!("Failed to check update: {}", e);
                }
            }
        });
    }
}

pub fn check_notify() {
    tauri::async_runtime::spawn(async move {
        info!("Checking for notifications...");

        #[cfg(target_os = "macos")]
        let os_type = "macos";
        #[cfg(target_os = "windows")]
        let os_type = "windows";
        #[cfg(target_os = "linux")]
        let os_type = "linux";

        let language = match get("app_language") {
            Some(v) => v.as_str().unwrap().to_string(),
            None => {
                "en".to_string()
            }
        };
        
        let client = reqwest::Client::new();
        match client.post("https://saladict.aichatone.com/api/app-check-notify")
            .json(&serde_json::json!({
                "language": language
            }))
            .send()
            .await {
                Ok(response) => {
                    match response.json::<serde_json::Value>().await {
                        Ok(json) => {
                            info!("Got notification response");
                            
                            // Get the OS-specific config
                            if let Some(os_config) = json.get(os_type) {
                                let version = os_config.get("version")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("");
                                let content = os_config.get("content")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("");
                                let enable = os_config.get("enable")
                                    .and_then(|v| v.as_bool())
                                    .unwrap_or(false);
                                
                                let last_version = get("last_notify_version")
                                    .and_then(|v| v.as_str().map(String::from))
                                    .unwrap_or_default();
                                
                                info!("Last notification version: {}, Current version: {}", last_version, version);
                                
                                // Set the last checked version regardless of notification status
                                set("last_notify_version", version);
                                
                                if enable && version != last_version && !content.is_empty() {
                                    info!("Showing notification with content: {}", content);
                                    notify_window(content);
                                }
                            }
                        }
                        Err(e) => warn!("Failed to parse notification response: {}", e),
                    }
                }
                Err(e) => warn!("Failed to fetch notifications: {}", e),
            }
    });
}
