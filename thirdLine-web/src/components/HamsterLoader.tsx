import { cx } from '@/utils/format'

/**
 * 仓鼠跑轮加载动画。
 *
 * 素材来自 https://uiverse.io/Nawsome/wet-mayfly-23，原版用 styled-components
 * 书写；本项目没有引入该依赖，样式改为普通 CSS（styles/loader.css），
 * 组件只负责结构，用法上与项目里其它组件保持一致。
 *
 * 三个内置用法：
 *   - 路由懒加载占位：<RouteFallback />
 *   - 页面数据加载：  <Loading />（components/Feedback.tsx）
 *   - 全屏校验加载：  className="hamster-loader--fullscreen"
 */
export function HamsterLoader({
  text = '加载中…',
  size = 14,
  className,
}: {
  /** 动画下方的提示文案；传 null 则只显示动画 */
  text?: React.ReactNode
  /** 尺寸基准（px）：跑轮直径 = 12 × size，原版基准为 14 */
  size?: number
  /** 附加类名，用于复用 .page-loader / .hamster-loader--fullscreen 等既有样式 */
  className?: string
}) {
  return (
    <div className={cx('hamster-loader', className)} role="status" aria-live="polite">
      <div
        className="wheel-and-hamster"
        role="img"
        aria-label="一只橘色仓鼠在金属跑轮里奔跑"
        style={{ '--hamster-size': `${size}px` } as React.CSSProperties}
      >
        <div className="wheel" />
        <div className="hamster">
          <div className="hamster__body">
            <div className="hamster__head">
              <div className="hamster__ear" />
              <div className="hamster__eye" />
              <div className="hamster__nose" />
            </div>
            <div className="hamster__limb hamster__limb--fr" />
            <div className="hamster__limb hamster__limb--fl" />
            <div className="hamster__limb hamster__limb--br" />
            <div className="hamster__limb hamster__limb--bl" />
            <div className="hamster__tail" />
          </div>
        </div>
        <div className="spoke" />
      </div>
      {text !== null && text !== undefined ? <span className="hamster-loader__text">{text}</span> : null}
    </div>
  )
}
