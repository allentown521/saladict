import { signInSocial } from '@daveyplate/better-auth-tauri';
import { useBetterAuthTauri } from '@daveyplate/better-auth-tauri/react';
import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { isTauri } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import { authClient } from '@/lib/auth-client';

export function Providers({ children }: { children: ReactNode }) {
    const navigate = useNavigate();

    useBetterAuthTauri({
        authClient,
        scheme: 'bas',
        onSuccess: (callbackURL) => navigate(`/auth/callback?redirectTo=${callbackURL}`),
        debugLogs: true,
    });

    return (
        <AuthUIProvider
            authClient={authClient}
            onSessionChange={() => {
                // Clear router cache (protected routes)
                window.location.reload();
            }}
            baseURL={isTauri() ? 'bas://' : undefined}
            social={{
                providers: ['google'],
                signIn: (params) => signInSocial({ ...params, authClient }),
            }}
        >
            {children}

            <Toaster />
        </AuthUIProvider>
    );
}
