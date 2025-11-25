import { fetch, Body } from '@tauri-apps/api/http';

export async function translate(text, from, to, options = {}) {
    const { config } = options;

    const { username: user, token } = config;

    let header = {};
    if (user !== '' && token !== '') {
        header['user'] = user;
        header['token'] = token;
    }

    const url = 'https://transmart.qq.com/api/imt';

    const res = await fetch(url, {
        method: 'POST',
        body: Body.json({
            header: {
                fn: 'auto_translation',
                client_key: 'browser-chrome-110.0.0-Mac OS-df4bd4c5-a65d-44b2-a40f-42f34f3535f2-1677486696487',
                ...header,
            },
            type: 'plain',
            source: {
                lang: from,
                text_list: [text],
            },
            target: {
                lang: to,
            },
        }),
    });
    if (res.ok) {
        const result = res.data;
        if (result['auto_translation']) {
            let target = '';
            for (let line of result['auto_translation']) {
                target += line;
                target += '\n';
            }
            return target.trim();
        } else {
            throw JSON.stringify(result);
        }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}

export * from './Config';
export * from './info';
