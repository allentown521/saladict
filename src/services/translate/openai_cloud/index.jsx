import { Language } from './info';
import { defaultRequestArguments } from './Config';
import { translate as openAICompletion } from '../openai_compatible';

export async function translate(text, from, to, options) {
    return await openAICompletion(text, from, to, options, defaultRequestArguments, Language);
}

export * from './Config';
export * from './info';
