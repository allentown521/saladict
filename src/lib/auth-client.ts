import { createAuthClient } from 'better-auth/react';
import { fetch as tauriFetch, FetchOptions, HttpVerb, Body, Response as TauriResponse } from '@tauri-apps/api/http';
import { readTextFile, writeTextFile, BaseDirectory, createDir, removeFile } from '@tauri-apps/api/fs';

// Cookie文件路径
const COOKIE_FILE_PATH = 'auth-cookie.txt';

// 从文件读取cookie
const loadCookieFromFile = async (): Promise<string | null> => {
    try {
        const cookie = await readTextFile(COOKIE_FILE_PATH, { dir: BaseDirectory.AppConfig });
        return cookie.trim() || null;
    } catch {
        return null;
    }
};

// 将cookie保存到文件
const saveCookieToFile = async (cookie: string): Promise<void> => {
    try {
        // 确保目录存在
        await createDir('', { dir: BaseDirectory.AppConfig, recursive: true }).catch(() => {
            // 目录可能已存在，忽略错误
        });

        // 保存cookie文件
        await writeTextFile(COOKIE_FILE_PATH, cookie, { dir: BaseDirectory.AppConfig });
        console.log('Cookie saved successfully to:', COOKIE_FILE_PATH);
    } catch (error) {
        console.error('Failed to save cookie:', error);
        // 在开发环境中提供更详细的错误信息
        if (typeof error === 'object' && error !== null) {
            console.error('Error details:', JSON.stringify(error, null, 2));
        }
    }
};

// 删除cookie文件
const deleteCookieFile = async (): Promise<void> => {
    try {
        await removeFile(COOKIE_FILE_PATH, { dir: BaseDirectory.AppConfig });
        console.log('Cookie file deleted successfully');
    } catch (error) {
        console.error('Failed to delete cookie file:', error);
        // 文件不存在时忽略错误
        if (typeof error === 'object' && error !== null) {
            console.error('Error details:', JSON.stringify(error, null, 2));
        }
    }
};

export const tauriFetchImpl = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // 将标准 fetch 参数转换为 Tauri fetch 参数
    const url = typeof input === 'string' ? input : input.toString();

    // 将 HTTP 方法转换为 Tauri 的 HttpVerb 类型
    const method = (init?.method?.toUpperCase() || 'GET') as HttpVerb;

    // 从文件加载cookie
    const storedCookie = await loadCookieFromFile();

    // 如果请求地址包含 current-plan，则添加存储的cookie
    const headers = { ...((init?.headers as Record<string, string>) || {}) };
    if (needAppendCookies(url) && storedCookie) {
        headers['Cookie'] = storedCookie;
    }

    if (needDeleteCookies(url)) {
        await deleteCookieFile();
    }

    // 正确处理 body 字段
    let body: Body | undefined = undefined;
    if (init?.body) {
        if (typeof init.body === 'string') {
            try {
                // 如果是 JSON 字符串，使用 Json body
                const parsedBody = JSON.parse(init.body);
                body = Body.json(parsedBody);
            } catch {
                // 如果不是 JSON，使用 Text body
                body = Body.text(init.body);
            }
        } else if (init.body instanceof FormData) {
            // 处理 FormData
            body = Body.form(init.body);
        } else if (init.body instanceof ArrayBuffer) {
            // 处理 ArrayBuffer
            body = Body.bytes(new Uint8Array(init.body));
        } else if (init.body instanceof Blob) {
            // 处理 Blob
            body = Body.bytes(await init.body.arrayBuffer());
        } else {
            // 其他情况使用 Json body
            body = Body.json(init.body);
        }
    }

    const options: FetchOptions = {
        method: method,
        headers: headers,
        body: body,
        timeout: 30000,
        // 启用响应类型为二进制以支持流
        responseType: 2, // 2 = ResponseType.Binary
    };

    const response = await tauriFetch(url, options).catch((error) => {
        throw new Error(error);
    });

    // 如果响应包含 api/auth/sign-in/，则存储cookie
    if (needSaveCookies(url) && response.rawHeaders) {
        const setCookieHeader = response.rawHeaders['set-cookie'] || response.rawHeaders['Set-Cookie'];
        if (setCookieHeader) {
            // 遍历所有cookie并合并存储
            const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
            const cookieValues = cookies.map((cookie) => cookie.split(';')[0]).join('; ');
            await saveCookieToFile(cookieValues);
        }
    }

    // 检查是否为流响应
    const contentType = response.headers['content-type'] || '';
    const isStreamResponse =
        contentType.includes('text/event-stream') ||
        contentType.includes('application/octet-stream') ||
        contentType.includes('application/x-ndjson') ||
        contentType.includes('application/stream') ||
        (contentType.includes('text/plain') &&
            response.data instanceof ArrayBuffer &&
            response.data.byteLength > 1024) ||
        (init && 'body' in init && init.body instanceof ReadableStream);

    // 调试信息
    if (isStreamResponse) {
        console.log('Stream response detected:', {
            contentType,
            dataType: typeof response.data,
            dataConstructor: response.data?.constructor?.name,
            isArrayBuffer: response.data instanceof ArrayBuffer,
            isString: typeof response.data === 'string',
            isBlob: response.data instanceof Blob,
            isObject: typeof response.data === 'object' && response.data !== null,
        });
    }

    let resBody;
    if (isStreamResponse) {
        // 对于流响应，处理不同类型的数据
        if (response.data instanceof ArrayBuffer) {
            // 如果是 ArrayBuffer，使用专门的流处理函数
            resBody = createStreamResponse(response.data, contentType);
        } else if (typeof response.data === 'string') {
            // 如果是字符串，转换为 Uint8Array 后创建流
            const uint8Array = new TextEncoder().encode(response.data);
            const arrayBuffer = uint8Array.buffer;
            resBody = createStreamResponse(arrayBuffer, contentType);
        } else if (response.data instanceof Blob) {
            // 如果是 Blob，创建异步流
            resBody = new ReadableStream({
                async start(controller) {
                    try {
                        const arrayBuffer = await response.data.arrayBuffer();
                        const streamResponse = createStreamResponse(arrayBuffer, contentType);
                        const reader = streamResponse.getReader();
                        
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            controller.enqueue(value);
                        }
                        controller.close();
                    } catch (error) {
                        controller.error(error);
                    }
                }
            });
        } else if (typeof response.data === 'object' && response.data !== null) {
            // 如果是对象，转换为字符串后再处理
            const jsonString = JSON.stringify(response.data);
            const uint8Array = new TextEncoder().encode(jsonString);
            const arrayBuffer = uint8Array.buffer;
            resBody = createStreamResponse(arrayBuffer, contentType);
        } else {
            // 其他情况，创建空流
            resBody = new ReadableStream({
                start(controller) {
                    controller.close();
                }
            });
        }
    } else {
        // 将 Tauri 的 Response 转换为标准的 Response 对象
        // 处理 response.data 的类型转换
        if (response.data !== null && response.data !== undefined) {
            if (typeof response.data === 'string') {
                resBody = response.data;
            } else if (response.data instanceof ArrayBuffer) {
                resBody = response.data;
            } else if (response.data instanceof Blob) {
                resBody = response.data;
            } else if (typeof response.data === 'object') {
                resBody = JSON.stringify(response.data);
            }
        }
    }

    // Tauri Response 可能没有 statusText 属性，使用空字符串
    const statusText = '';

    return new Response(resBody, {
        status: response.status,
        statusText: statusText,
        headers: new Headers(response.headers as Record<string, string>),
    });
};

const needAppendCookies = (url: string): boolean => {
    return (
        url.includes(import.meta.env.VITE_API_BASE_URL) &&
        !url.includes('api/auth/sign-in/') &&
        !url.includes('api/auth/sign-up/')
    );
};

const needDeleteCookies = (url: string): boolean => {
    return url.includes(import.meta.env.VITE_API_BASE_URL) && url.includes('sign-out');
};

const needSaveCookies = (url: string): boolean => {
    return url.includes(import.meta.env.VITE_API_BASE_URL) && !url.includes('api/auth/sign-up/');
};
// 创建流式响应的辅助函数
const createStreamResponse = (data: ArrayBuffer, contentType: string): ReadableStream<Uint8Array> => {
    return new ReadableStream({
        start(controller) {
            const uint8Array = new Uint8Array(data);

            // 根据内容类型决定分块策略
            if (contentType.includes('text/event-stream')) {
                // Server-Sent Events: 按行分割
                const text = new TextDecoder().decode(uint8Array);
                const lines = text.split('\n');

                lines.forEach((line, index) => {
                    if (line.trim()) {
                        const lineData = new TextEncoder().encode(line + '\n');
                        setTimeout(() => {
                            controller.enqueue(lineData);
                        }, index * 10); // 模拟延迟
                    }
                });

                setTimeout(() => controller.close(), lines.length * 10);
            } else {
                // 其他流类型: 按固定大小分块
                const chunkSize = 1024; // 1KB chunks
                let offset = 0;

                const pushChunk = () => {
                    if (offset >= uint8Array.length) {
                        controller.close();
                        return;
                    }

                    const chunk = uint8Array.slice(offset, offset + chunkSize);
                    controller.enqueue(chunk);
                    offset += chunkSize;

                    // 使用 setImmediate 或 setTimeout 来避免阻塞
                    setTimeout(pushChunk, 0);
                };

                pushChunk();
            }
        },
        cancel() {
            console.log('Stream response cancelled');
        },
    });
};

// 导出删除cookie的函数供外部使用
export const clearStoredCookie = deleteCookieFile;

// 导出流式请求的辅助函数
export const streamRequest = async (url: string, options?: RequestInit): Promise<Response> => {
    const streamOptions = {
        ...options,
        headers: {
            Accept: 'text/event-stream, application/octet-stream, application/x-ndjson',
            ...options?.headers,
        },
    };

    return tauriFetchImpl(url, streamOptions);
};

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    fetchOptions: { customFetchImpl: tauriFetchImpl },
});
