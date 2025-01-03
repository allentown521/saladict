import { fetch, ResponseType } from '@tauri-apps/api/http';
import { getTk } from './token';
export async function tts(text, lang) {

    const res = await fetch(`https://translate.google.com/translate_tts`,{
        method: 'GET',
        query: {
            tl: lang,
            q: text,
            ie: 'UTF-8',
            client: 't',
            total: '1',
            idx: '0',
            tk: (await getTk(text)).value
        },
        responseType: ResponseType.Binary
    });

    if (res.ok) {
        return res.data;
    } else {
        return Promise.reject(new Error(`\nFailed to fetch TTS audio: ${res.status} \n${res.data}`));
    }
}

export * from './Config';
export * from './info';
