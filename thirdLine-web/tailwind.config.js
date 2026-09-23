/** @type {import('tailwindcss').Config} */
export default {
  // 关闭 preflight，避免 Tailwind 的 base reset 覆盖 Ant Design v5 组件样式；
  // 基础重置在 src/index.css 中手动处理。
  corePlugins: {
    preflight: false,
  },
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        bone: '#F7F6F3',
        surface: '#F9F9F8',
        ink: '#111111',
        charcoal: '#2F3437',
        muted: '#787774',
        line: '#EAEAEA',
        // 柔色 pastel（标签 / 状态）
        paleRed: { bg: '#FDEBEC', fg: '#9F2F2D' },
        paleBlue: { bg: '#E1F3FE', fg: '#1F6C9F' },
        paleGreen: { bg: '#EDF3EC', fg: '#346538' },
        paleYellow: { bg: '#FBF3DB', fg: '#956400' },
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"Geist Sans"', '"Helvetica Neue"', 'Switzer', 'sans-serif'],
        serif: ['Newsreader', '"Playfair Display"', '"Instrument Serif"', 'serif'],
        mono: ['"JetBrains Mono"', '"Geist Mono"', '"SF Mono"', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      maxWidth: {
        '4xl': '56rem',
        '5xl': '64rem',
      },
      boxShadow: {
        subtle: '0 2px 8px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
