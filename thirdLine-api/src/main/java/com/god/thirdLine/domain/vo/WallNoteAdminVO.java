package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 留言墙-后台留言对象。
 * <p>
 * 比前台 VO 多出审核、显示状态、举报数与作者 ID，供审核列表使用。
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallNoteAdminVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    private String content;

    private String paperColor;

    private Double posX;

    private Double posY;

    private Double rotateDeg;

    /** 审核状态：0待审核 1已通过 2已拒绝 */
    private Integer auditStatus;

    /** 审核意见 / 拒绝原因 */
    private String auditRemark;

    private LocalDateTime auditTime;

    /** 显示状态：0隐藏 1显示 */
    private Integer status;

    /** 被举报次数 */
    private Integer reportCount;

    /** 作者 ID，仅后台可见 */
    private Long userId;

    private Integer version;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
