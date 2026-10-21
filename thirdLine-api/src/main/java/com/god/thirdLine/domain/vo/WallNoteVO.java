package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 留言墙-前台留言（信纸）。
 * <p>
 * 刻意只下发展示所需字段：作者 ID、IP、审核备注、举报次数都不在返回里。
 * {@code owned} 只表示「是不是当前登录用户贴的」，用来决定能不能拖动，不泄露作者身份。
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallNoteVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    private String content;

    private String paperColor;

    /** 左上角 X（逻辑画布坐标） */
    private Double posX;

    /** 左上角 Y（逻辑画布坐标） */
    private Double posY;

    private Double rotateDeg;

    private Integer version;

    /** 创建时间，前台展示的日期取自这里 */
    private LocalDateTime createTime;

    /** 是否是当前登录用户贴的 */
    private Boolean owned;

    /**
     * 是否还在审核中。
     * 公开列表里只有「自己的待审核留言」会带 true，其他人的待审核留言根本不会返回。
     */
    private Boolean pending;
}
