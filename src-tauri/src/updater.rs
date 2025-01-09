use crate::config::{get, set};
use crate::window::updater_window;
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
