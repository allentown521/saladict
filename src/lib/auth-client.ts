import { tauriFetchImpl } from "@daveyplate/better-auth-tauri"
import { createAuthClient } from "better-auth/react"


export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BASE_URL,
    fetchOptions: { customFetchImpl: tauriFetchImpl }
})
