import { createAuthClient } from 'better-auth/react';
// export const tauriFetchImpl: typeof fetch = (...params) => tauriFetch(...params);

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BASE_URL,
    // tauri2 可以使用 tauri http plugin（服务端请求，没有跨域问题） ，tauri1 测试不行，所以tauri1 需要配置cors
    // fetchOptions: { customFetchImpl: tauriFetchImpl },
});
