/** @type {import('tailwindcss').Config} */
import scrollbar from 'tailwind-scrollbar';

export default {
    content: ['./source/**/*.{js,ts,jsx,tsx,mdx}'],
    plugins: [scrollbar],
    theme: {
        extend: {
            fontFamily: {
                poppins: ['Poppins', 'sans-serif'],
                rubik: ['Rubik', 'sans-serif'],
            },
            colors: {
                'blue-100': '#A2B3FF',
                'blue-200': '#839AFF',
                'blue-300': '#738DFF',
                'blue-400': '#6480FF',
                'blue-500': '#486AFF',
                'blue-600': '#3257FE',
            },
            boxShadow: {
                '3xl': '0 15px 50px 32px rgba(0, 0, 0, 0.3)',
            },
            keyframes: {
                'pulse-size': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(0.6)' },
                },
            },
            animation: {
                'pulse-size': 'pulse-size 4s ease-in-out infinite',
            },
        },
    },
};
