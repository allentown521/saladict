import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useNavigate, NavLink } from 'react-router-dom';

import { authClient } from './lib/auth-client';

// 适配器组件，将 NavLink 转换为 AuthUIProvider 期望的 Link 类型
const LinkAdapter = ({
    href,
    className,
    children,
    ...props
}: {
    href: string;
    className?: string;
    children: ReactNode;
}) => {
    return (
        <NavLink
            to={href}
            className={typeof className === 'function' ? undefined : className}
            {...props}
        >
            {children}
        </NavLink>
    );
};

export function Providers({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    return (
        <AuthUIProvider
            authClient={authClient}
            redirectTo='/general'
            navigate={navigate}
            Link={LinkAdapter}
        >
            {children}

            <Toaster />
        </AuthUIProvider>
    );
}
