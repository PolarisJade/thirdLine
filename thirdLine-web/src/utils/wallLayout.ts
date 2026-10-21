/**
 * 留言墙几何计算。
 *
 * 这是 `WallLayout.java` 的 TypeScript 镜像：碰撞判定、环形让位、整墙兜底扫描
 * 的步骤和参数必须保持一致，否则会出现「拖动时看着能放，点√后被挪走」的割裂感。
 * 尺寸参数不写死在这里，由 `/user/wall/config` 下发。
 */

export interface WallGeometry {
  canvasWidth: number
  canvasHeight: number
  paperWidth: number
  paperHeight: number
  /** 信纸之间的安全间距 */
  gap: number
  /** 坐标吸附粒度 */
  grid: number
}

export interface WallPoint {
  x: number
  y: number
}

/** 环形搜索的角度步长，与后端一致 */
const ANGLE_STEP = 15
/** 环形搜索的半径步长 */
const RADIUS_STEP = 12
/** 环形搜索的最大半径，超过后退化成整墙扫描 */
const MAX_RING_RADIUS = 720

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}

function snap(value: number, grid: number): number {
  return Math.round(value / grid) * grid
}

function snapDown(value: number, grid: number): number {
  return Math.floor(value / grid) * grid
}

/** 夹到画布内并吸附到网格 */
export function clampPosition(x: number, y: number, geo: WallGeometry): WallPoint {
  // 上界向下取整到网格，避免吸附后超出预留边距
  const maxX = snapDown(geo.canvasWidth - geo.paperWidth - geo.gap, geo.grid)
  const maxY = snapDown(geo.canvasHeight - geo.paperHeight - geo.gap, geo.grid)
  return {
    x: snap(clamp(x, geo.gap, maxX), geo.grid),
    y: snap(clamp(y, geo.gap, maxY), geo.grid),
  }
}

/** 两张信纸是否冲突（含安全间距） */
export function overlaps(a: WallPoint, b: WallPoint, geo: WallGeometry): boolean {
  return (
    a.x < b.x + geo.paperWidth + geo.gap &&
    b.x < a.x + geo.paperWidth + geo.gap &&
    a.y < b.y + geo.paperHeight + geo.gap &&
    b.y < a.y + geo.paperHeight + geo.gap
  )
}

export function isFree(point: WallPoint, occupied: WallPoint[], geo: WallGeometry): boolean {
  return occupied.every((other) => !overlaps(point, other, geo))
}

function distanceSquared(a: WallPoint, b: WallPoint): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

/** 找出与目标位置冲突、且中心距离最近的那张信纸，作为让位的圆心 */
function findBlocker(desired: WallPoint, occupied: WallPoint[], geo: WallGeometry): WallPoint | null {
  let blocker: WallPoint | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  for (const other of occupied) {
    if (!overlaps(desired, other, geo)) continue
    const dx = other.x + geo.paperWidth / 2 - (desired.x + geo.paperWidth / 2)
    const dy = other.y + geo.paperHeight / 2 - (desired.y + geo.paperHeight / 2)
    const distance = dx * dx + dy * dy
    if (distance < bestDistance) {
      bestDistance = distance
      blocker = other
    }
  }
  return blocker
}

/**
 * 计算最终落点：优先保留用户位置；被占时以「压住的那张」为圆心环形找空位；
 * 环形找不到再整墙扫描；整面墙都放不下返回 null。
 */
export function placeNote(
  desired: WallPoint,
  occupied: WallPoint[],
  geo: WallGeometry,
): WallPoint | null {
  const target = clampPosition(desired.x, desired.y, geo)
  if (isFree(target, occupied, geo)) {
    return target
  }

  const blocker = findBlocker(target, occupied, geo)
  if (blocker) {
    const centerX = blocker.x + geo.paperWidth / 2
    const centerY = blocker.y + geo.paperHeight / 2
    const startRadius = Math.max(geo.paperWidth, geo.paperHeight) / 2 + geo.gap

    for (let radius = startRadius; radius <= MAX_RING_RADIUS; radius += RADIUS_STEP) {
      let best: WallPoint | null = null
      let bestDistance = Number.POSITIVE_INFINITY
      for (let angle = 0; angle < 360; angle += ANGLE_STEP) {
        const radians = (angle * Math.PI) / 180
        const candidate = clampPosition(
          centerX + Math.cos(radians) * radius - geo.paperWidth / 2,
          centerY + Math.sin(radians) * radius - geo.paperHeight / 2,
          geo,
        )
        if (!isFree(candidate, occupied, geo)) continue
        // 同一圈里优先离用户原落点最近的
        const distance = distanceSquared(candidate, target)
        if (distance < bestDistance) {
          best = candidate
          bestDistance = distance
        }
      }
      if (best) return best
    }
  }

  let fallback: WallPoint | null = null
  let fallbackDistance = Number.POSITIVE_INFINITY
  const maxX = snapDown(geo.canvasWidth - geo.paperWidth - geo.gap, geo.grid)
  const maxY = snapDown(geo.canvasHeight - geo.paperHeight - geo.gap, geo.grid)
  const start = snap(geo.gap, geo.grid)
  for (let y = start; y <= maxY; y += geo.grid) {
    for (let x = start; x <= maxX; x += geo.grid) {
      const candidate = { x, y }
      if (!isFree(candidate, occupied, geo)) continue
      const distance = distanceSquared(candidate, target)
      if (distance < fallbackDistance) {
        fallback = candidate
        fallbackDistance = distance
      }
    }
  }
  return fallback
}

export function toPoints(notes: Array<{ posX: number; posY: number }>): WallPoint[] {
  return notes.map((note) => ({ x: note.posX, y: note.posY }))
}
