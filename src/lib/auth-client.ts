import { createAuthClient } from 'better-auth/react';
import { fetch as tauriFetch, FetchOptions, HttpVerb, Body } from '@tauri-apps/api/http';
import { readTextFile, writeTextFile, BaseDirectory, createDir, removeFile } from '@tauri-apps/api/fs';

// Cookie file path
const COOKIE_FILE_PATH = 'auth-cookie.txt';

// Load cookie from file
const loadCookieFromFile = async (): Promise<string | null> => {
    try {
        const cookie = await readTextFile(COOKIE_FILE_PATH, { dir: BaseDirectory.AppConfig });
        return cookie.trim() || null;
    } catch {
        return null;
    }
};

// Save cookie to file
const saveCookieToFile = async (cookie: string): Promise<void> => {
    try {
        // Ensure directory exists
        await createDir('', { dir: BaseDirectory.AppConfig, recursive: true }).catch(() => {
            // Directory might already exist, ignore error
        });

        // Save cookie file
        await writeTextFile(COOKIE_FILE_PATH, cookie, { dir: BaseDirectory.AppConfig });
        console.log('Cookie saved successfully to:', COOKIE_FILE_PATH);
    } catch (error) {
        console.error('Failed to save cookie:', error);
        // Provide more detailed error information in development environment
        if (typeof error === 'object' && error !== null) {
            console.error('Error details:', JSON.stringify(error, null, 2));
        }
    }
};

// Delete cookie file
const deleteCookieFile = async (): Promise<void> => {
    try {
        await removeFile(COOKIE_FILE_PATH, { dir: BaseDirectory.AppConfig });
        console.log('Cookie file deleted successfully');
    } catch (error) {
        console.error('Failed to delete cookie file:', error);
        // Ignore error when file doesn't exist
        if (typeof error === 'object' && error !== null) {
            console.error('Error details:', JSON.stringify(error, null, 2));
        }
    }
};

/**
 * Custom fetch implementation that handles Tauri-specific requirements and cookie management
 *
 * Cloud API requires cookies for authentication. For Tauri 2, you can simply replace customFetchImpl and all cloud API calls with Tauri HTTP plugin's fetch
 * For Tauri 1, window.fetch works normally on Windows, but Mac's WKWebView doesn't include cookies when making API calls
 * Therefore, we implemented this based on Tauri 1's fetch to automatically add cookies, usage should be like window.fetch rather than Tauri's fetch
 *
 * @param {RequestInfo | URL} input - The URL or Request object for the request
 * @param {RequestInit} [init] - Optional request initialization options
 * @returns {Promise<Response>} A promise that resolves to the Response object
 * @throws {Error} If the fetch operation fails
 *
 * @description
 * This function provides a custom fetch implementation that:
 * - Converts standard fetch parameters to Tauri-compatible format
 * - Manages cookie storage and retrieval from file
 * - Handles different body types (JSON, FormData, ArrayBuffer, Blob)
 * - Supports streaming responses with proper content type detection
 * - Converts Tauri Response to standard Response object
 */
export const tauriFetchImpl = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // Convert standard fetch parameters to Tauri fetch parameters
    const url = typeof input === 'string' ? input : input.toString();

    // Convert HTTP method to Tauri's HttpVerb type
    const method = (init?.method?.toUpperCase() || 'GET') as HttpVerb;

    // Load cookie from file
    const storedCookie = await loadCookieFromFile();

    // If request URL contains current-plan, add stored cookie
    const headers = { ...((init?.headers as Record<string, string>) || {}) };

    // Add real User-Agent header
    headers['User-Agent'] = navigator.userAgent;

    if (needAppendCookies(url) && storedCookie) {
        headers['Cookie'] = storedCookie;
    }

    if (needDeleteCookies(url)) {
        await deleteCookieFile();
    }

    // Handle body field correctly
    let body: Body | undefined = undefined;
    if (init?.body) {
        if (typeof init.body === 'string') {
            try {
                // If it's a JSON string, use Json body
                const parsedBody = JSON.parse(init.body);
                body = Body.json(parsedBody);
            } catch {
                // If not JSON, use Text body
                body = Body.text(init.body);
            }
        } else if (init.body instanceof FormData) {
            // Handle FormData
            body = Body.form(init.body);
        } else if (init.body instanceof ArrayBuffer) {
            // Handle ArrayBuffer
            body = Body.bytes(new Uint8Array(init.body));
        } else if (init.body instanceof Blob) {
            // Handle Blob
            body = Body.bytes(await init.body.arrayBuffer());
        } else {
            // Other cases use Json body
            body = Body.json(init.body);
        }
    }

    const options: FetchOptions = {
        method: method,
        headers: headers,
        body: body,
        timeout: 30000,
        // Enable binary response type to support streaming
        responseType: 2, // 2 = ResponseType.Binary
    };

    const response = await tauriFetch(url, options).catch((error) => {
        throw new Error(error);
    });

    // If response contains api/auth/sign-in/, store cookie
    if (needSaveCookies(url) && response.rawHeaders) {
        const setCookieHeader = response.rawHeaders['set-cookie'] || response.rawHeaders['Set-Cookie'];
        if (setCookieHeader) {
            // Iterate through all cookies and merge for storage
            const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
            const cookieValues = cookies.map((cookie) => cookie.split(';')[0]).join('; ');
            
            // Check if session_token exists and is not empty
            const sessionTokenMatch = cookieValues.match(/session_token=([^;]+)/);
            if (sessionTokenMatch && sessionTokenMatch[1] && sessionTokenMatch[1].trim() !== '') {
                await saveCookieToFile(cookieValues);
            } else {
                console.log('Session token is empty or not found, skipping cookie save');
            }
        }
    }

    // Check if it's a stream response
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

    // Debug information
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
        // For stream responses, handle different data types
        if (response.data instanceof ArrayBuffer) {
            // If it's ArrayBuffer, use dedicated stream handling function
            resBody = createStreamResponse(response.data, contentType);
        } else if (typeof response.data === 'string') {
            // If it's a string, convert to Uint8Array then create stream
            const uint8Array = new TextEncoder().encode(response.data);
            const arrayBuffer = uint8Array.buffer;
            resBody = createStreamResponse(arrayBuffer, contentType);
        } else if (response.data instanceof Blob) {
            // If it's Blob, create async stream
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
                },
            });
        } else if (typeof response.data === 'object' && response.data !== null) {
            // If it's an object, convert to string then process
            const jsonString = JSON.stringify(response.data);
            const uint8Array = new TextEncoder().encode(jsonString);
            const arrayBuffer = uint8Array.buffer;
            resBody = createStreamResponse(arrayBuffer, contentType);
        } else {
            // Other cases, create empty stream
            resBody = new ReadableStream({
                start(controller) {
                    controller.close();
                },
            });
        }
    } else {
        // Convert Tauri Response to standard Response object
        // Handle type conversion of response.data
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

    // Tauri Response might not have statusText property, use empty string
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
// Helper function to create streaming response
const createStreamResponse = (data: ArrayBuffer, contentType: string): ReadableStream<Uint8Array> => {
    return new ReadableStream({
        start(controller) {
            const uint8Array = new Uint8Array(data);

            // Decide chunking strategy based on content type
            if (contentType.includes('text/event-stream')) {
                // Server-Sent Events: split by lines
                const text = new TextDecoder().decode(uint8Array);
                const lines = text.split('\n');

                lines.forEach((line, index) => {
                    if (line.trim()) {
                        const lineData = new TextEncoder().encode(line + '\n');
                        setTimeout(() => {
                            controller.enqueue(lineData);
                        }, index * 10); // Simulate delay
                    }
                });

                setTimeout(() => controller.close(), lines.length * 10);
            } else {
                // Other stream types: chunk by fixed size
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

                    // Use setImmediate or setTimeout to avoid blocking
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

// Export cookie deletion function for external use
export const clearStoredCookie = deleteCookieFile;

// Export helper function for streaming requests
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
