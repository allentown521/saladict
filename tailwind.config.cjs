// tailwind.config.js
const { nextui } = require('@nextui-org/react');

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
        './node_modules/@daveyplate/better-auth-ui/dist/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
        },
    },
    plugins: [
        nextui({
            themes: {
                dark: {
                    colors: {
                        background: '#202020',
                        foreground: '#e7e7e7',
                        content1: '#282828',
                        content2: '#303030',
                        content3: '#383838',
                        content4: '#404040',
                        default: {
                            DEFAULT: '#484848',
                            50: '#282828',
                            100: '#383838',
                            200: '#484848',
                            300: '#585858',
                            400: '#686868',
                            500: '#a7a7a7',
                            600: '#b7b7b7',
                            700: '#c7c7c7',
                            800: '#d7d7d7',
                            900: '#e7e7e7',
                        },
                        primary: {
                            DEFAULT: '#49cee9',
                            foreground: '#181818',
                        },
                    },
                },
                light: {
                    colors: {
                        background: '#ffffff',
                        foreground: '#181818',
                        content1: '#eeeeee',
                        content2: '#dddddd',
                        content3: '#cccccc',
                        content4: '#bbbbbb',
                        default: {
                            DEFAULT: '#999999',
                            50: '#eeeeee',
                            100: '#cccccc',
                            200: '#aaaaaa',
                            300: '#999999',
                            400: '#888888',
                            500: '#686868',
                            600: '#585858',
                            700: '#484848',
                            800: '#383838',
                            900: '#282828',
                        },
                        primary: {
                            foreground: '#ffffff',
                            DEFAULT: '#3578e5',
                        },
                    },
                },
            },
        }),
    ],
};
