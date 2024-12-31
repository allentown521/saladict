import { fetch } from '@tauri-apps/api/http';
import { DEFAULT_EDGE_USER_AGENT } from '../../../utils/http';

export async function translate(text, from, to) {
    const token_url = 'https://edge.microsoft.com/translate/auth';

    let token = await fetch(token_url, {
        method: 'GET',
        headers: {
            'User-Agent': DEFAULT_EDGE_USER_AGENT,
        },
        responseType: 2,
    });

    if (token.ok) {
        const url = 'https://api-edge.cognitive.microsofttranslator.com/translate';

        let res = await fetch(url, {
            method: 'POST',
            headers: {
                accept: '*/*',
                'accept-language': 'zh-TW,zh;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5',
                authorization: 'Bearer ' + token.data,
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                pragma: 'no-cache',
                'sec-ch-ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                Referer: 'https://appsumo.com/',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'User-Agent': DEFAULT_EDGE_USER_AGENT,
            },
            query: {
                from: from,
                to: to,
                'api-version': '3.0',
                includeSentenceLength: 'true',
            },
            body: { type: 'Json', payload: [{ Text: text }] },
        });

        if (res.ok) {
            let result = res.data;
            if (result[0].translations) {
                return result[0].translations[0].text.trim();
            } else {
                throw JSON.stringify(result);
            }
        } else {
            throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
        }
    } else {
        throw 'Get Token Failed';
    }
}

export * from './Config';
export * from './info';
