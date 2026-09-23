import type { ThemeConfig } from 'antd'

/**
 * Ant Design 主题定制，贴合 minimalist-ui 暖色单色 / 极扁平规范：
 * 主色近黑、边框极浅、无阴影、 crisp 圆角。
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#111111',
    colorInfo: '#1F6C9F',
    colorLink: '#1F6C9F',
    colorTextBase: '#2F3437',
    colorTextSecondary: '#787774',
    colorBorder: '#EAEAEA',
    colorBorderSecondary: '#EAEAEA',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F7F6F3',
    borderRadius: 6,
    borderRadiusLG: 8,
    fontFamily:
      "'SF Pro Display', 'Geist Sans', 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    fontSize: 14,
    controlHeight: 36,
    boxShadow: 'none',
    boxShadowSecondary: 'none',
  },
  components: {
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
      fontWeight: 500,
    },
    Table: {
      headerBg: '#F7F6F3',
      headerColor: '#111111',
      borderColor: '#EAEAEA',
      rowHoverBg: '#F9F9F8',
    },
    Card: {
      colorBorderSecondary: '#EAEAEA',
      boxShadowTertiary: 'none',
    },
    Menu: {
      itemSelectedBg: '#F7F6F3',
      itemSelectedColor: '#111111',
      itemBorderRadius: 6,
    },
    Input: {
      activeBorderColor: '#111111',
      hoverBorderColor: '#787774',
      activeShadow: '0 0 0 2px rgba(17,17,17,0.06)',
    },
    Tag: {
      defaultBg: '#F7F6F3',
      defaultColor: '#2F3437',
    },
  },
}
