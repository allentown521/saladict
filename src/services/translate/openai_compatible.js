import { tauriFetchImpl } from '../../lib/auth-client';
export async function translate(text, from, to, options, defaultRequestArguments, supportLanguage) {
    const { config, setResult, detect } = options;

    let { service, requestPath, model, apiKey, stream, promptList, requestArguments } = config;

    if (!/https?:\/\/.+/.test(requestPath)) {
        requestPath = `https://${requestPath}`;
    }
    const apiUrl = new URL(requestPath);

    promptList = promptList.map((item) => {
        return {
            ...item,
            content: item.content
                .replaceAll('$text', text)
                .replaceAll('$from', from)
                .replaceAll('$to', to)
                .replaceAll('$detect', supportLanguage[detect]),
        };
    });

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
    };
    const body = {
        ...JSON.parse(requestArguments ?? defaultRequestArguments),
        model: model,
        stream: stream,
        messages: promptList,
    };

    if (stream) {
        let res;
        try {
            res = await tauriFetchImpl(apiUrl.href, {
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
                                    if (result?.choices[0]?.delta?.content) {
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
                                    if (result?.choices[0]?.delta?.content) {
                                        target += result.choices[0].delta.content;
                                        if (setResult) {
                                            setResult(target + '_');
                                        } else {
                                            return '[STREAM]';
                                        }
                                    }
                                }
                            } catch (e) {
                                console.log('error data', e);
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
        let res;
        try {
            res = await tauriFetchImpl(apiUrl.href, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });
        } catch (error) {
            throw `Http Request Error: ${error.message}`;
        }
        if (res.ok) {
            let result = await res.json();
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
            const errorText = await res.text();
            throw `${errorText}`;
        }
    }
}
