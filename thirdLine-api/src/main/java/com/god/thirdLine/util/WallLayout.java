package com.god.thirdLine.util;

import java.util.List;

/**
 * 留言墙的几何计算：坐标归一化、碰撞检测、以及「落点被占时就近让位」的放置算法。
 *
 * <p>服务端与前端各有一份实现，参数完全一致（都由 {@code /user/wall/config} 下发），
 * 前端负责拖动时的实时预览，服务端负责落库前的最终裁决：两边算出来的结果越接近，
 * 用户点「√」之后信纸就越不会跳位。</p>
 *
 * <p>碰撞用「轴对齐矩形 + 安全间距」判断，不处理旋转：信纸最大旋转 5°，
 * 旋转后外接矩形最多外扩约 13px，而 {@link #GAP} 取 14，已经覆盖得住，
 * 因此没必要做多边形相交，白算一遍三角函数。</p>
 *
 * @author ParlisJade
 */
public final class WallLayout {

    /** 逻辑画布宽：比一屏宽得多，左右两侧都可以继续贴信纸，靠平移查看 */
    public static final double CANVAS_WIDTH = 3200;

    /** 逻辑画布高：比一屏高，整面墙可以向下滚动 */
    public static final double CANVAS_HEIGHT = 2000;

    /** 信纸宽（逻辑像素） */
    public static final double PAPER_WIDTH = 280;

    /** 信纸高（逻辑像素） */
    public static final double PAPER_HEIGHT = 190;

    /** 两张信纸之间至少留出的间距 */
    public static final double GAP = 14;

    /** 坐标吸附粒度：避免出现 137.428 这种脏数据 */
    public static final double GRID = 8;

    /** 环形搜索的角度步长 */
    private static final double ANGLE_STEP = 15;

    /** 环形搜索的半径步长 */
    private static final double RADIUS_STEP = 12;

    /** 环形搜索的最大半径，超过后退化成整墙网格扫描 */
    private static final double MAX_RING_RADIUS = 720;

    /** 整墙兜底扫描的步长（与吸附粒度一致，否则会漏掉网格偏移的空位） */
    private static final double SCAN_STEP = GRID;

    /** 浮点比较容差 */
    private static final double EPS = 0.01;

    private WallLayout() {
    }

    /** 信纸左上角坐标 */
    public record Point(double x, double y) {
    }

    /**
     * 已占用的信纸（只关心左上角，尺寸固定）
     */
    public record Rect(double x, double y) {
    }

    /**
     * 把坐标夹到画布内并吸附到网格
     */
    public static Point normalize(double x, double y) {
        // 上界向下取整到网格：如果直接对夹紧后的值四舍五入，画布边缘可能只留 10px 边距
        double maxX = snapDown(CANVAS_WIDTH - PAPER_WIDTH - GAP);
        double maxY = snapDown(CANVAS_HEIGHT - PAPER_HEIGHT - GAP);
        return new Point(snap(clamp(x, GAP, maxX)), snap(clamp(y, GAP, maxY)));
    }

    /**
     * 两张信纸是否冲突（含安全间距）
     */
    public static boolean overlaps(Point a, Point b) {
        return a.x() < b.x() + PAPER_WIDTH + GAP
                && b.x() < a.x() + PAPER_WIDTH + GAP
                && a.y() < b.y() + PAPER_HEIGHT + GAP
                && b.y() < a.y() + PAPER_HEIGHT + GAP;
    }

    public static boolean isFree(Point point, List<Rect> occupied) {
        if (occupied == null || occupied.isEmpty()) {
            return true;
        }
        for (Rect rect : occupied) {
            if (overlaps(point, new Point(rect.x(), rect.y()))) {
                return false;
            }
        }
        return true;
    }

    /**
     * 计算最终落点。
     *
     * <p>优先保留用户选的位置；被占时先找出「压住的那张信纸」，
     * 以它为圆心由近及远环形找空位（也就是需求里的「自动放到被遮盖信纸附近」），
     * 环形找不到再退回整墙扫描；整面墙都放不下返回 {@code null}。</p>
     *
     * @param desiredX   用户期望的左上角 X
     * @param desiredY   用户期望的左上角 Y
     * @param occupied   当前可见信纸
     * @return 最终落点；整面墙已满时返回 null
     */
    public static Point place(double desiredX, double desiredY, List<Rect> occupied) {
        Point desired = normalize(desiredX, desiredY);
        if (isFree(desired, occupied)) {
            return desired;
        }

        Rect blocker = findBlocker(desired, occupied);
        if (blocker != null) {
            // 以被压住的那张信纸为圆心，一圈一圈往外找
            double centerX = blocker.x() + PAPER_WIDTH / 2;
            double centerY = blocker.y() + PAPER_HEIGHT / 2;
            double startRadius = Math.max(PAPER_WIDTH, PAPER_HEIGHT) / 2 + GAP;
            for (double radius = startRadius; radius <= MAX_RING_RADIUS; radius += RADIUS_STEP) {
                Point best = null;
                double bestDistance = Double.MAX_VALUE;
                for (double angle = 0; angle < 360; angle += ANGLE_STEP) {
                    double radians = Math.toRadians(angle);
                    Point candidate = normalize(
                            centerX + Math.cos(radians) * radius - PAPER_WIDTH / 2,
                            centerY + Math.sin(radians) * radius - PAPER_HEIGHT / 2);
                    if (!isFree(candidate, occupied)) {
                        continue;
                    }
                    // 同一圈里优先选离用户原落点最近的，尽量尊重用户想放的方向
                    double distance = distanceSquared(candidate, desired);
                    if (distance < bestDistance) {
                        best = candidate;
                        bestDistance = distance;
                    }
                }
                if (best != null) {
                    return best;
                }
            }
        }

        // 兜底：整墙逐格扫描，取离原落点最近的空位
        Point fallback = null;
        double fallbackDistance = Double.MAX_VALUE;
        double maxX = snapDown(CANVAS_WIDTH - PAPER_WIDTH - GAP);
        double maxY = snapDown(CANVAS_HEIGHT - PAPER_HEIGHT - GAP);
        double start = snap(GAP);
        for (double y = start; y <= maxY; y += SCAN_STEP) {
            for (double x = start; x <= maxX; x += SCAN_STEP) {
                Point candidate = new Point(x, y);
                if (!isFree(candidate, occupied)) {
                    continue;
                }
                double distance = distanceSquared(candidate, desired);
                if (distance < fallbackDistance) {
                    fallback = candidate;
                    fallbackDistance = distance;
                }
            }
        }
        return fallback;
    }

    /**
     * 找出与目标位置冲突、且中心距离最近的那张信纸作为「锚点」
     */
    private static Rect findBlocker(Point desired, List<Rect> occupied) {
        if (occupied == null || occupied.isEmpty()) {
            return null;
        }
        Rect blocker = null;
        double bestDistance = Double.MAX_VALUE;
        for (Rect rect : occupied) {
            Point other = new Point(rect.x(), rect.y());
            if (!overlaps(desired, other)) {
                continue;
            }
            double centerX = rect.x() + PAPER_WIDTH / 2;
            double centerY = rect.y() + PAPER_HEIGHT / 2;
            double dx = centerX - (desired.x() + PAPER_WIDTH / 2);
            double dy = centerY - (desired.y() + PAPER_HEIGHT / 2);
            double distance = dx * dx + dy * dy;
            if (distance < bestDistance) {
                bestDistance = distance;
                blocker = rect;
            }
        }
        return blocker;
    }

    private static double distanceSquared(Point a, Point b) {
        double dx = a.x() - b.x();
        double dy = a.y() - b.y();
        return dx * dx + dy * dy;
    }

    private static double clamp(double value, double min, double max) {
        if (Double.isNaN(value)) {
            return min;
        }
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    }

    private static double snap(double value) {
        return Math.round(value / GRID) * GRID;
    }

    private static double snapDown(double value) {
        return Math.floor(value / GRID) * GRID;
    }

    /**
     * 判断两个坐标是否等价（用于判断服务端是否对位置做了调整）
     */
    public static boolean samePosition(Point a, double x, double y) {
        return Math.abs(a.x() - x) < EPS && Math.abs(a.y() - y) < EPS;
    }
}
