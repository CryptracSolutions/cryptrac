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
        // Cryptrac Brand Colors
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7f5efd', // Main Cryptrac purple
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Neutral grays for professional look
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
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
        lg: "16px",
        md: "calc(16px - 2px)",
        sm: "calc(16px - 4px)",
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
        // Fine print
        'xs': ['12px', { lineHeight: '19px', letterSpacing: '-0.1px' }],
        // Small text
        'sm': ['14px', { lineHeight: '22px', letterSpacing: '-0.1px' }],
        // Body text
        'base': ['16px', { lineHeight: '24px', letterSpacing: '-0.25px' }],
        // Large body text
        'lg': ['18px', { lineHeight: '26px', letterSpacing: '-0.25px' }],
        'xl': ['20px', { lineHeight: '28px', letterSpacing: '-0.3px' }],
        // Subheadings
        '2xl': ['22px', { lineHeight: '30px', letterSpacing: '-0.5px' }],
        // Section headers
        '3xl': ['28px', { lineHeight: '34px', letterSpacing: '-0.8px' }],
        '4xl': ['36px', { lineHeight: '42px', letterSpacing: '-1px' }],
        // Main headers
        '5xl': ['40px', { lineHeight: '48px', letterSpacing: '-1px' }],
        '6xl': ['52px', { lineHeight: '62px', letterSpacing: '-2px' }],
        // Brand statement
        '7xl': ['72px', { lineHeight: '78px', letterSpacing: '-1px' }],
        // Hero
        '8xl': ['90px', { lineHeight: '79.2px', letterSpacing: '-4.661px' }],
      },
      fontWeight: {
        light: '300',
        normal: '400', 
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // Standardised 200 ms fade & scale animations; removed bounce and slide-in variants
        "fade-in": "fade-in 0.2s ease-in-out",
        "scale-in": "scale-in 0.2s ease-in-out",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Simplified keyframes to align with new animation guidelines
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}

