package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * <p>
 * 留言墙-举报表
 * </p>
 * 同一用户对同一条留言只能举报一次（由唯一索引兜底），
 * 举报由站主统一处理，因此不记录处理人 ID。
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_wall_note_report")
public class WallNoteReport implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 处理状态：待处理 */
    public static final int STATUS_PENDING = 0;

    /** 处理状态：举报成立 */
    public static final int STATUS_ACCEPTED = 1;

    /** 处理状态：举报不成立 */
    public static final int STATUS_REJECTED = 2;

    /** 举报类型：垃圾广告 */
    public static final int REASON_SPAM = 1;

    /** 举报类型：辱骂攻击 */
    public static final int REASON_ABUSE = 2;

    /** 举报类型：色情低俗 */
    public static final int REASON_PORN = 3;

    /** 举报类型：政治敏感 */
    public static final int REASON_POLITICS = 4;

    /** 举报类型：违法信息 */
    public static final int REASON_ILLEGAL = 5;

    /** 举报类型：其他 */
    public static final int REASON_OTHER = 6;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 被举报留言 tl_wall_note.id
     */
    private Long noteId;

    /**
     * 举报人 tl_user.id；仅用于去重和追责，前台不得返回
     */
    private Long reporterUserId;

    /**
     * 举报类型：1垃圾广告 2辱骂攻击 3色情低俗 4政治敏感 5违法信息 6其他
     */
    private Integer reasonType;

    /**
     * 补充说明
     */
    private String reason;

    /**
     * 处理状态：0待处理 1举报成立 2举报不成立
     */
    private Integer status;

    /**
     * 站主处理备注
     */
    private String handleRemark;

    /**
     * 处理时间
     */
    private LocalDateTime handleTime;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
