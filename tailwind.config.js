/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Stripe-Parity Brand Colors with Cryptrac purple
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7f5efd', // Cryptrac purple (replaces Stripe #635BFF)
          600: '#6d4fdd',
          700: '#5b3fc0',
          800: '#4a3399',
          900: '#3a2873',
          950: '#2a1d52',
        },
        // Stripe-matched gray scale
        gray: {
          50: '#F6F9FC',  // Canvas background
          100: '#F6F8FA', // Hover states
          200: '#E3E8EE', // Input borders
          300: '#D5DBE1', // Default borders
          400: '#A3ACBA', // Disabled text
          500: '#8792A2', // Tertiary text
          600: '#6A7383', // Secondary text
          700: '#4B5563',
          800: '#30313D', // Primary text
          900: '#0A2540', // Navigation bg
          950: '#063667', // App header
        },
        // Muted success palette (≈35 % saturation)
        success: {
          50: '#f1fdf6',
          100: '#e3f9ec',
          200: '#c4f1d5',
          300: '#9be8b7',
          400: '#70d68c', // softened green
          500: '#41c064',
          600: '#2fa154',
          700: '#28834a',
          800: '#24663d',
          900: '#1e4c32',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#e9d68c', // muted
          500: '#d6b370', // muted
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#d68c8c', // muted
          500: '#c07070', // muted
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Shadcn/UI required colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        xs: "4px",   // Buttons, checkboxes
        sm: "5px",   // Input fields
        md: "8px",   // Cards, drawers
        lg: "12px",  // Large cards
        xl: "16px",  // Extra large elements
      },
      fontFamily: {
        // Robinhood-inspired typography system
        'phonic': ['Phonic', 'Helvetica', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Arial', 'sans-serif'],
        'capsule': ['"Capsule Sans Text"', 'sans-serif'],
        'martina': ['"Martina Plantijn"', 'serif'],
        sans: ['Phonic', 'Helvetica', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Arial', 'sans-serif'],
        serif: ['"Martina Plantijn"', 'serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      fontSize: {
        // Stripe-matched type scale
        'xs': ['11px', { lineHeight: '16px', letterSpacing: '-0.4px' }],  // Subheadings/labels
        'sm': ['12px', { lineHeight: '16px', letterSpacing: '-0.1px' }],  // Captions
        'base': ['14px', { lineHeight: '20px', letterSpacing: '-0.154px' }], // Body text
        'lg': ['16px', { lineHeight: '24px', letterSpacing: '-0.4px' }],  // Headings
        'xl': ['20px', { lineHeight: '28px', letterSpacing: '0.3px' }],   // Display titles
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.4px' }],
        '3xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.4px' }],
        '4xl': ['36px', { lineHeight: '44px', letterSpacing: '-0.9px' }],
        '5xl': ['48px', { lineHeight: '56px', letterSpacing: '-0.9px' }],
        '6xl': ['60px', { lineHeight: '72px', letterSpacing: '-1.8px' }],
        '7xl': ['72px', { lineHeight: '90px', letterSpacing: '-0.9px' }],
        '8xl': ['96px', { lineHeight: '120px', letterSpacing: '-4px' }],
      },
      fontWeight: {
        light: '300',
        normal: '400', 
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      spacing: {
        // Stripe 4px grid system
        '0': '0px',
        'xxs': '2px',
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        'xxl': '32px',
        '3xl': '48px',
        '4xl': '64px',
        // Component-specific spacing
        'button-x': '8px',
        'button-y': '4px',
        'input': '8px',
        'card': '16px',
        'section': '16px',
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      boxShadow: {
        // Stripe elevation system
        'soft': '0px 1px 1px rgba(0,0,0,0.12), 0px 2px 5px rgba(60,66,87,0.08)',
        'medium': '0px 2px 5px rgba(60,66,87,0.12), 0px 1px 1px rgba(0,0,0,0.08)',
        'elevated': '0px 7px 14px rgba(48,49,61,0.08), 0px 3px 6px rgba(0,0,0,0.12)',
        'high': '0px 15px 35px rgba(48,49,61,0.12), 0px 5px 15px rgba(0,0,0,0.08)',
        'focus': '0 0 0 2px var(--tw-ring-offset-color), 0 0 0 4px var(--tw-ring-color)',
      },
      transitionDuration: {
        '0': '0ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      width: {
        // Drawer/Modal widths
        'drawer-sm': '320px',
        'drawer-md': '344px',
        'drawer-lg': '480px',
        'drawer-xl': '640px',
        'modal-sm': '400px',
        'modal-md': '600px',
        'modal-lg': '800px',
      },
      height: {
        // Component heights
        'button-xs': '24px',
        'button-sm': '28px',
        'button-md': '32px',
        'button-lg': '40px',
        'input-sm': '28px',
        'input-md': '32px',
        'input-lg': '40px',
        'header': '60px',
        'app-bar': '40px',
      },
      zIndex: {
        'dropdown': '10',
        'sticky': '20',
        'fixed': '30',
        'modal-backdrop': '40',
        'modal': '50',
        'notification': '60',
        'tooltip': '70',
        'max': '9999',
      },
      animation: {
        // Stripe-matched animations
        "fade-in": "fadeIn 200ms ease forwards",
        "fade-out": "fadeOut 200ms ease forwards",
        "scale-in": "scaleIn 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "scale-out": "scaleOut 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-in-right": "slideInRight 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-in-bottom": "slideInBottom 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-out-right": "slideOutRight 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "spin": "spin 1s linear infinite",
        "pulse": "pulse 2s ease-in-out infinite",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "shake": "shake 0.5s ease",
        "checkmark": "checkmark 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // Wave flow animations for hero background (preserved)
        'wave-flow-1': 'wave-flow-1 20s ease-in-out infinite',
        'wave-flow-2': 'wave-flow-2 25s ease-in-out infinite',
        'wave-flow-3': 'wave-flow-3 30s ease-in-out infinite',
        'wave-flow-4': 'wave-flow-4 22s ease-in-out infinite',
        'wave-flow-5': 'wave-flow-5 35s ease-in-out infinite',
      },
      keyframes: {
        // Stripe-matched keyframes
        "fadeIn": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fadeOut": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "scaleIn": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "scaleOut": {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" },
        },
        "slideInRight": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slideInBottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slideOutRight": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%": { transform: "translateX(-4px)" },
          "20%": { transform: "translateX(4px)" },
          "30%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "50%": { transform: "translateX(-2px)" },
          "60%": { transform: "translateX(2px)" },
        },
        "checkmark": {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Wave flow keyframes for hero background
        'wave-flow-1': {
          '0%': { transform: 'translateX(-10%) translateY(0px)' },
          '50%': { transform: 'translateX(-5%) translateY(-10px)' },
          '100%': { transform: 'translateX(-10%) translateY(0px)' },
        },
        'wave-flow-2': {
          '0%': { transform: 'translateX(5%) translateY(0px)' },
          '50%': { transform: 'translateX(10%) translateY(8px)' },
          '100%': { transform: 'translateX(5%) translateY(0px)' },
        },
        'wave-flow-3': {
          '0%': { transform: 'translateX(-5%) translateY(0px)' },
          '50%': { transform: 'translateX(0%) translateY(-5px)' },
          '100%': { transform: 'translateX(-5%) translateY(0px)' },
        },
        'wave-flow-4': {
          '0%': { transform: 'translateX(8%) translateY(0px)' },
          '50%': { transform: 'translateX(12%) translateY(6px)' },
          '100%': { transform: 'translateX(8%) translateY(0px)' },
        },
        'wave-flow-5': {
          '0%': { transform: 'translateX(0%) translateY(0px)' },
          '50%': { transform: 'translateX(3%) translateY(-3px)' },
          '100%': { transform: 'translateX(0%) translateY(0px)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}

