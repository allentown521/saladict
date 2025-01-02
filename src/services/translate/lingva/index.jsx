import { fetch, Body } from '@tauri-apps/api/http';
import { info } from './info';

export async function translate(text, from, to, options = {}) {
    const { config } = options;

    let { requestPath = info.defaultEndpoint } = config;

    if (requestPath.length === 0) {
        requestPath = info.defaultEndpoint;
    }
    if (!requestPath.startsWith('http')) {
        requestPath = 'https://' + requestPath;
    }

    let plain_text = text.replaceAll('/', '@@');
    let encode_text = encodeURIComponent(plain_text);
    const res = await fetch(`${requestPath}/api/v1/${from}/${to}/${encode_text}`, {
        method: 'GET',
    });

    if (res.ok) {
        let result = res.data;
        const { translation } = result;
        if (translation) {
            return translation.replaceAll('@@', '/');
        } else {
            throw JSON.stringify(result.trim());
        }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}

export * from './Config';
export * from './info';
