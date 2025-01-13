use crate::utils;
use crate::window::{self, THUMB_WIN_NAME};

use parking_lot::Mutex;
use crate::config::{get, set};
use mouce::{Mouse, MouseActions};
use tauri::{LogicalPosition, LogicalSize, Manager, PhysicalPosition, PhysicalSize, State};
use log::info;
use crate::APP;

pub static CPU_VENDOR: Mutex<String> = Mutex::new(String::new());
pub static SELECTED_TEXT: Mutex<String> = Mutex::new(String::new());
pub static PREVIOUS_PRESS_TIME: Mutex<u128> = Mutex::new(0);
pub static PREVIOUS_RELEASE_TIME: Mutex<u128> = Mutex::new(0);
pub static PREVIOUS_RELEASE_POSITION: Mutex<(i32, i32)> = Mutex::new((0, 0));
pub static RELEASE_THREAD_ID: Mutex<u32> = Mutex::new(0);

pub fn bind_mouse_hook() {
    if !utils::query_accessibility_permissions() {
        return;
    }

    // Mouse event hook requires `sudo` permission on linux.
    // Let's just skip it.
    if cfg!(target_os = "linux") {
        info!("mouse event hook skipped in linux!");
        return;
    }

    std::thread::spawn(|| {
        let mut mouse_manager = Mouse::new();
        let hook_result = mouse_manager.hook(Box::new(|event| {
            let always_show_icons = get("show_icon_when_text_is_selected").map_or(false, |v| v.as_bool().unwrap());
            match event {
                mouce::common::MouseEvent::Press(mouce::common::MouseButton::Left) => {
                    if !always_show_icons {
                        return;
                    }
                    let current_press_time = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_millis();
                    *PREVIOUS_PRESS_TIME.lock() = current_press_time;
                }
                mouce::common::MouseEvent::Release(mouce::common::MouseButton::Left) => {
                    if !always_show_icons {
                        window::delete_thumb();
                        return;
                    }
                    let current_release_time = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_millis();
                    let mut is_text_selected_event = false;
                    let (x, y): (i32, i32) = window::get_mouse_location().unwrap();
                    let (prev_release_x, prev_release_y) = { *PREVIOUS_RELEASE_POSITION.lock() };
                    {
                        *PREVIOUS_RELEASE_POSITION.lock() = (x, y);
                    }
                    let mouse_distance =
                        (((x - prev_release_x).pow(2) + (y - prev_release_y).pow(2)) as f64).sqrt();
                    let mut previous_press_time = 0;
                    let mut previous_release_time = 0;
                    {
                        let previous_press_time_lock = PREVIOUS_PRESS_TIME.lock();
                        let mut previous_release_time_lock = PREVIOUS_RELEASE_TIME.lock();
                        previous_release_time = *previous_release_time_lock;
                        *previous_release_time_lock = current_release_time;
                        previous_press_time = *previous_press_time_lock;
                    }
                    let is_pressed = previous_release_time < previous_press_time;
                    let pressed_time = current_release_time - previous_press_time;
                    let is_double_click =
                        current_release_time - previous_release_time < 700 && mouse_distance < 10.0;
                    if is_pressed && pressed_time > 300 && mouse_distance > 20.0 {
                        is_text_selected_event = true;
                    }
                    if previous_release_time != 0 && is_double_click {
                        is_text_selected_event = true;
                    }
                    let is_click_on_thumb = match APP.get() {
                        Some(handle) => match handle.get_window(THUMB_WIN_NAME) {
                            Some(window) => match window.outer_position() {
                                Ok(position) => {
                                    let scale_factor = window.scale_factor().unwrap_or(1.0);
                                    if let Ok(size) = window.outer_size() {
                                        if cfg!(target_os = "macos") {
                                            let LogicalPosition { x: x1, y: y1 } =
                                                position.to_logical::<i32>(scale_factor);
                                            let LogicalSize {
                                                width: mut w,
                                                height: mut h,
                                            } = size.to_logical::<i32>(scale_factor);
                                            if cfg!(target_os = "windows") {
                                                w = (20.0 as f64 * scale_factor) as i32;
                                                h = (20.0 as f64 * scale_factor) as i32;
                                            }
                                            let (x2, y2) = (x1 + w, y1 + h);
                                            let res = x >= x1 && x <= x2 && y >= y1 && y <= y2;
                                            res
                                        } else {
                                            let PhysicalPosition { x: x1, y: y1 } = position;
                                            let PhysicalSize {
                                                width: mut w,
                                                height: mut h,
                                            } = size;
                                            if cfg!(target_os = "windows") {
                                                w = (20.0 as f64 * scale_factor) as u32;
                                                h = (20.0 as f64 * scale_factor) as u32;
                                            }
                                            let (x2, y2) = (x1 + w as i32, y1 + h as i32);
                                            let res = x >= x1 && x <= x2 && y >= y1 && y <= y2;
                                            res
                                        }
                                    } else {
                                        false
                                    }
                                }
                                Err(err) => {
                                    println!("err: {:?}", err);
                                    false
                                }
                            },
                            None => false,
                        },
                        None => false,
                    };
                    // debug_println!("is_text_selected_event: {}", is_text_selected_event);
                    // debug_println!("is_click_on_thumb: {}", is_click_on_thumb);
                    if !is_text_selected_event && !is_click_on_thumb {
                        window::close_thumb();
                        // println!("not text selected event");
                        // println!("is_click_on_thumb: {}", is_click_on_thumb);
                        // println!("mouse_distance: {}", mouse_distance);
                        // println!("pressed_time: {}", pressed_time);
                        // println!("released_time: {}", current_release_time - previous_release_time);
                        // println!("is_double_click: {}", is_double_click);
                        return;
                    }

                    if !is_click_on_thumb {
                        if RELEASE_THREAD_ID.is_locked() {
                            return;
                        }
                        std::thread::spawn(move || {
                            // Add a small delay for double click to let other apps handle the event first
                            if is_double_click {
                                std::thread::sleep(std::time::Duration::from_millis(100));
                            }

                            #[cfg(target_os = "macos")]
                            {
                                if !utils::is_valid_selected_frame().unwrap_or(false) {
                                    info!("No valid selected frame");
                                    window::close_thumb();
                                    return;
                                }
                            }

                            let _lock = RELEASE_THREAD_ID.lock();
                            let selected_text = selection::get_text();
                            if !selected_text.is_empty() {
                                {
                                    *SELECTED_TEXT.lock() = selected_text;
                                }
                                window::show_thumb(x, y);
                            } else {
                                window::close_thumb();
                            }
                        });
                    } else {
                        window::close_thumb();

                        let selected_text = (*SELECTED_TEXT.lock()).to_string();
                        if !selected_text.is_empty() {
                            window::text_translate(selected_text);
                        }
                    }
                }
                _ => {}
            }
        }));

        match hook_result {
            Ok(_) => {
                info!("mouse event Hooked!");
            }
            Err(e) => {
                info!("Error: {}", e);
            }
        }
    });
}