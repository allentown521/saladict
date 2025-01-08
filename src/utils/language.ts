// ISO-639-1 + Country Code (Option)
// https://zh.wikipedia.org/wiki/ISO_639-1%E4%BB%A3%E7%A0%81%E8%A1%A8
export const languageList = [
    'zh_cn',
    'zh_tw',
    'en',
    'ja',
    'ko',
    'fr',
    'es',
    'ru',
    'de',
    'it',
    'tr',
    'pt_pt',
    'pt_br',
    'vi',
    'id',
    'th',
    'ms',
    'ar',
    'hi',
    'km',
    'mn_cy',
    'nb_no',
    'nn_no',
    'fa',
    'sv',
    'pl',
    'nl',
    'uk',
    'he',
    'mn_mo',
] as const;

// https://flagicons.lipis.dev/
export enum LanguageFlag {
    zh_cn = 'cn',
    zh_tw = 'cn',
    mn_mo = 'cn',
    en = 'gb',
    ja = 'jp',
    ko = 'kr',
    fr = 'fr',
    es = 'es',
    ru = 'ru',
    de = 'de',
    it = 'it',
    tr = 'tr',
    pt_pt = 'pt',
    pt_br = 'br',
    vi = 'vn',
    id = 'id',
    th = 'th',
    ms = 'ms',
    ar = 'ae',
    hi = 'in',
    km = 'kh',
    mn_cy = 'mn',
    nb_no = 'no',
    nn_no = 'no',
    fa = 'ir',
    sv = 'se',
    pl = 'pl',
    nl = 'nl',
    uk = 'ua',
    he = 'il',
}

export interface Language {
    code: LanguageFlag;
    displayName: string;
}

type UiLanguageType = {
    [K in keyof typeof uiLanguageData]: Language;
} & {
    includes(lang: string): boolean;
    find(predicate: (lang: Language) => boolean): Language | undefined;
};

export const uiLanguageData = {
    zh_cn: { code: LanguageFlag.zh_cn, displayName: '简体中文' },
    zh_tw: { code: LanguageFlag.zh_tw, displayName: '繁體中文' },
    en: { code: LanguageFlag.en, displayName: 'English' },
    ja: { code: LanguageFlag.ja, displayName: '日本語' },
    ko: { code: LanguageFlag.ko, displayName: '한국어' },
    fr: { code: LanguageFlag.fr, displayName: 'Français' },
    es: { code: LanguageFlag.es, displayName: 'Español' },
    ru: { code: LanguageFlag.ru, displayName: 'Русский' },
    de: { code: LanguageFlag.de, displayName: 'Deutsch' },
    it: { code: LanguageFlag.it, displayName: 'Italiano' },
    tr: { code: LanguageFlag.tr, displayName: 'Türkçe' },
    pt_pt: { code: LanguageFlag.pt_pt, displayName: 'Português' },
    pt_br: { code: LanguageFlag.pt_br, displayName: 'Português (Brasil)' },
    nb_no: { code: LanguageFlag.nb_no, displayName: 'Norsk Bokmål' },
    nn_no: { code: LanguageFlag.nn_no, displayName: 'Norsk Nynorsk' },
    fa: { code: LanguageFlag.fa, displayName: 'فارسی' },
    uk: { code: LanguageFlag.uk, displayName: 'Українська' },
    ar: { code: LanguageFlag.ar, displayName: 'العربية' },
    he: { code: LanguageFlag.he, displayName: 'עִבְרִית' }
} as const;

export const uiLanguage: UiLanguageType = {
    ...uiLanguageData,
    includes(lang: string): boolean {
        return lang in uiLanguageData;
    },
    find(predicate: (lang: Language) => boolean): Language | undefined {
        const entries = Object.entries(uiLanguageData);
        const found = entries.find(([_, lang]) => predicate(lang));
        return found ? found[1] : undefined;
    }
};
