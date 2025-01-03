import { fetch, ResponseType } from '@tauri-apps/api/http';
export async function tts(text, lang) {

    const res = await fetch(`https://fanyi.baidu.com/gettts/`,{
        method: 'GET',
        query: {
            lan: lang,
            text: text,
            spd: '5'
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
