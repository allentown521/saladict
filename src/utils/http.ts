import { fetch, Body, FetchOptions } from '@tauri-apps/api/http';

export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
export const DEFAULT_EDGE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42';

export async function fetchWithUA(url: string, options: FetchOptions) {
    const headers = {
        ...options.headers,
        'User-Agent': DEFAULT_USER_AGENT,
    };

    return fetch(url, {
        ...options,
        headers,
    });
}

export { Body }; 