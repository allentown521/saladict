import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { authClient } from './lib/auth-client';

const DefaultLink = ({ href, className, children }: { href?: string; className?: string; children: ReactNode }) => (
    <a
        className={className}
        href={href}
        target={href?.includes('http') ? '_blank' : undefined}
    >
        {children}
    </a>
);

export function Providers({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    return (
        <AuthUIProvider
            authClient={authClient}
            redirectTo='/general'
            navigate={navigate}
            Link={DefaultLink}
        >
            {children}

            <Toaster />
        </AuthUIProvider>
    );
}
