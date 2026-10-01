package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
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
 * 弹幕举报记录表
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-27
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_danmaku_report")
public class DanmakuReport implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 处理状态：待处理 */
    public static final int STATUS_PENDING = 0;

    /** 处理状态：已处理 */
    public static final int STATUS_HANDLED = 1;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 被举报弹幕ID，关联tl_danmaku.id
     */
    private Long danmakuId;

    /**
     * 举报人用户ID，关联tl_user.id
     */
    private Long userId;

    /**
     * 举报理由（选填）
     */
    private String reason;

    /**
     * 处理状态：0待处理 1已处理
     */
    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
