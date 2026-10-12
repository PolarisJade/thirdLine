/**
 * 路由懒加载占位。
 *
 * 管理端页面按需加载（React.lazy），首次进入某个管理页时会短暂出现这个占位，
 * 避免白屏；样式见 styles/ui.css 的 .route-fallback。
 */
export function RouteFallback() {
  return (
    <div className="route-fallback">
      <span className="route-fallback__spinner" />
      <span>加载中…</span>
    </div>
  )
}
