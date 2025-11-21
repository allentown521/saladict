import { fetch, Body } from '@tauri-apps/api/http';
import { Language } from './info';
import { translate as openAICompletion } from '../openai_compatible';

export async function translate(text, from, to, options = {}) {
    return await openAICompletion(text, from, to, options, null, Language);
}

export * from './Config';
export * from './info';
