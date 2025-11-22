import { Language } from './info';
import * as jose from 'jose';
import { info } from 'tauri-plugin-log-api';
import { fetch, Body } from '@tauri-apps/api/http';

export async function translate(text, from, to, options = {}) {
    const { config, setResult, detect } = options;

    let { model, stream, apiKey, promptList } = config;

    let [id, secret] = apiKey.split('.');
    if (id === undefined || secret === undefined) {
        return Promise.reject('invalid apikey');
    }
    promptList = promptList.map((item) => {
        return {
            ...item,
            content: item.content
                .replaceAll('$text', text)
                .replaceAll('$from', from)
                .replaceAll('$to', to)
                .replaceAll('$detect', Language[detect]),
        };
    });

    //
    let timestamp = new Date().getTime();
    let payload = {
        api_key: id,
        exp: timestamp + 1000 * 60,
        timestamp: timestamp,
    };
    secret = new TextEncoder().encode(secret);
    let jwt = new jose.SignJWT(payload).setProtectedHeader({ alg: 'HS256', sign_type: 'SIGN' });
    let token = await jwt.sign(secret);

    const headers = {
        'Content-Type': 'application/json',
        Authorization: token,
    };

    const body = {
        model: model,
        thinking: { type: 'disabled' }, // disable thinking
        messages: promptList,
        stream,
    };

    const requestPath = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    if (stream) {
        let res;
        try {
            res = await window.fetch(requestPath, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });
        } catch (error) {
            throw `Http Request Error: ${error.message}`;
        }
        if (res.ok) {
            let target = '';
            const reader = res.body.getReader();
            try {
                let temp = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        setResult(target.trim());
                        return target.trim();
                    }
                    const str = new TextDecoder().decode(value);
                    let datas = str.split('data:');
                    for (let data of datas) {
                        if (data.trim() !== '' && data.trim() !== '[DONE]') {
                            try {
                                if (temp !== '') {
                                    data = temp + data.trim();
                                    let result = JSON.parse(data.trim());
                                    if (result.choices[0].delta.content) {
                                        target += result.choices[0].delta.content;
                                        if (setResult) {
                                            setResult(target + '_');
                                        } else {
                                            return '[STREAM]';
                                        }
                                    }
                                    temp = '';
                                } else {
                                    let result = JSON.parse(data.trim());
                                    if (result.choices[0].delta.content) {
                                        target += result.choices[0].delta.content;
                                        if (setResult) {
                                            setResult(target + '_');
                                        } else {
                                            return '[STREAM]';
                                        }
                                    }
                                }
                            } catch {
                                temp = data.trim();
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        } else {
            const errorText = await res.text();
            throw `${errorText}`;
        }
    } else {
        let res = await fetch(requestPath, {
            method: 'POST',
            headers: headers,
            body: Body.json(body),
        });

        if (res.ok) {
            let result = res.data;
            const { choices } = result;
            if (choices) {
                let target = choices[0].message.content.trim();
                if (target) {
                    if (target.startsWith('"')) {
                        target = target.slice(1);
                    }
                    if (target.endsWith('"')) {
                        target = target.slice(0, -1);
                    }
                    return target.trim();
                } else {
                    throw JSON.stringify(choices);
                }
            } else {
                throw JSON.stringify(result);
            }
        } else {
            throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
        }
    }
}

export * from './Config';
export * from './info';
