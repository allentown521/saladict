import { fetch } from '@tauri-apps/api/http';
import { info } from './info';
export async function tts(text, lang, options = {}) {
    const { config } = options;

    let { requestPath = info.defaultEndpoint } = config;

    if (requestPath.length === 0) {
        requestPath = info.defaultEndpoint;
    }

    if (!requestPath.startsWith('http')) {
        requestPath = 'https://' + requestPath;
    }
    const res = await fetch(`${requestPath}/api/v1/audio/${lang}/${encodeURIComponent(text)}`);

    if (res.ok) {
        return res.data['audio'];
    } else {
        return Promise.reject(new Error(`\nFailed to fetch TTS audio: ${res.status} \n${res.data}`));
    }
}

export * from './Config';
export * from './info';
