/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background:          '#0f0f0f',
        card:                '#1a1a1a',
        border:              '#2a2a2a',
        primary:             '#6366f1',
        'primary-foreground':'#ffffff',
        muted:               '#2a2a2a',
        'muted-foreground':  '#737373',
        foreground:          '#fafafa',
        destructive:         '#ef4444',
        'destructive-foreground': '#ffffff',
        'chart-1':           '#f97316',
        'chart-2':           '#14b8a6',
        'chart-3':           '#3b82f6',
        'chart-4':           '#eab308',
        'chart-5':           '#f59e0b',
      },
    },
  },
  plugins: [],
};
