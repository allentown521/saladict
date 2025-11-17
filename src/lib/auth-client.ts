import { createAuthClient } from 'better-auth/react';
export const tauriFetchImpl: typeof fetch = (...params) => fetch(...params);

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BASE_URL,
    fetchOptions: { customFetchImpl: tauriFetchImpl },
});
