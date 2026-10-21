package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 留言墙-后台举报对象
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallReportAdminVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    private Long noteId;

    /** 被举报留言的正文，留言已被删除时为 null */
    private String noteContent;

    /** 被举报留言当前是否还被举报（便于判断能否自动恢复） */
    private Integer noteStatus;

    /** 举报人 ID，仅后台可见 */
    private Long reporterUserId;

    /** 举报类型：1垃圾广告 2辱骂攻击 3色情低俗 4政治敏感 5违法信息 6其他 */
    private Integer reasonType;

    private String reason;

    /** 处理状态：0待处理 1举报成立 2举报不成立 */
    private Integer status;

    private String handleRemark;

    private LocalDateTime handleTime;

    private LocalDateTime createTime;
}
