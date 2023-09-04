import { fetch } from '@tauri-apps/api/http';
import { store } from '../../../utils/store';
import HmacSHA1 from 'crypto-js/hmac-sha1';
import base64 from 'crypto-js/enc-base64';

export async function translate(text, from, to, options = {}) {
    const { config } = options;

    let translateConfig = (await store.get('alibaba')) ?? {};
    if (config !== undefined) {
        translateConfig = config;
    }

    const { accesskey_id, accesskey_secret } = translateConfig;

    function getRandomNumber() {
        const rand = Math.floor(Math.random() * 99999) + 100000;
        return rand * 1000;
    }
    if (accesskey_id === '' || accesskey_secret === '') {
        throw 'Please configure AccessKey ID and AccessKey Secret';
    }
    if (!(from in supportLanguage) || !(to in supportLanguage)) {
        throw 'Unsupported Language';
    }

    let today = new Date();
    let timestamp = today.toISOString().replaceAll(/\.[0-9]*/g, '');
    let endpoint = 'http://mt.cn-hangzhou.aliyuncs.com/';
    let url_path = 'api/translate/web/general';

    let query = `AccessKeyId=${accesskey_id}&Action=TranslateGeneral&Format=JSON&FormatType=text&Scene=general&SignatureMethod=HMAC-SHA1&SignatureNonce=${getRandomNumber()}&SignatureVersion=1.0&SourceLanguage=${
        supportLanguage[from]
    }&SourceText=${encodeURIComponent(text)}&TargetLanguage=${supportLanguage[to]}&Timestamp=${encodeURIComponent(
        timestamp
    )}&Version=2018-10-12`;

    let CanonicalizedQueryString = endpoint + url_path + '?' + query;

    let stringToSign = 'GET' + '&' + encodeURIComponent('/') + '&' + encodeURIComponent(query);

    stringToSign = stringToSign.replaceAll('!', '%2521');
    stringToSign = stringToSign.replaceAll("'", '%2527');
    stringToSign = stringToSign.replaceAll('(', '%2528');
    stringToSign = stringToSign.replaceAll(')', '%2529');
    stringToSign = stringToSign.replaceAll('*', '%252A');
    stringToSign = stringToSign.replaceAll('+', '%252B');
    stringToSign = stringToSign.replaceAll(',', '%252C');

    let signature = base64.stringify(HmacSHA1(stringToSign, accesskey_secret + '&'));

    CanonicalizedQueryString = CanonicalizedQueryString + '&Signature=' + encodeURIComponent(signature);

    let res = await fetch(CanonicalizedQueryString, {
        method: 'GET',
    });

    if (res.ok) {
        let result = res.data;
        if (result['Code'] === '200') {
            if (result['Data']['Translated'] === text) {
                let secondLanguage = get('second_language') ?? 'en';
                if (to !== secondLanguage) {
                    await translate(text, from, secondLanguage, setText, id);
                    return;
                }
            }
            return result['Data']['Translated'].trim();
        } else {
            throw JSON.stringify(result);
        }
    } else {
        throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
    }
}

export * from './Config';
export * from './info';
