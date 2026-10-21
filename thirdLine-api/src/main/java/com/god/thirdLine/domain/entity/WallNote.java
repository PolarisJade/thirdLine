package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * <p>
 * 留言墙-留言（信纸）表
 * </p>
 * 一条记录就是墙上的一张信纸。前台可见条件恒为：
 * {@code auditStatus = 1 AND status = 1 AND deleted = 0}。
 * 位置由服务端在「创建 / 审核通过 / 拖动确认」三个时机做最终裁决，
 * 保证任何两张已展示的信纸都不会互相遮盖。
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_wall_note")
public class WallNote implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 审核状态：待审核（作者自己可见，其他人不可见） */
    public static final int AUDIT_PENDING = 0;

    /** 审核状态：已通过（进入墙面） */
    public static final int AUDIT_APPROVED = 1;

    /** 审核状态：已拒绝 */
    public static final int AUDIT_REJECTED = 2;

    /** 显示状态：隐藏（举报达标或站主临时下线） */
    public static final int STATUS_HIDDEN = 0;

    /** 显示状态：显示 */
    public static final int STATUS_VISIBLE = 1;

    /** 被举报自动隐藏时写入 audit_remark 的标记，用于复核后判断能不能自动恢复 */
    public static final String AUTO_HIDE_REMARK = "举报达到阈值，已自动隐藏待复核";

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 留言正文（纯文本，业务上限由 wall_max_length 控制）
     */
    private String content;

    /**
     * 信纸颜色 key，白名单见 tl_site_config.wall_palette
     */
    private String paperColor;

    /**
     * 信纸左上角 X，逻辑画布坐标
     */
    private Double posX;

    /**
     * 信纸左上角 Y，逻辑画布坐标
     */
    private Double posY;

    /**
     * 旋转角度 -5.0 ~ 5.0，创建时随机生成，只影响观感
     */
    private Double rotateDeg;

    /**
     * 审核状态：0待审核 1已通过 2已拒绝
     */
    private Integer auditStatus;

    /**
     * 审核意见 / 拒绝原因；举报自动隐藏时写入固定标记
     */
    private String auditRemark;

    /**
     * 审核时间，通过 / 拒绝时写入
     */
    private LocalDateTime auditTime;

    /**
     * 显示状态：0隐藏 1显示
     */
    private Integer status;

    /**
     * 被举报次数，冗余计数，原子自增
     */
    private Integer reportCount;

    /**
     * 发布人 tl_user.id；仅用于权限校验和追责，任何前台接口都不得返回
     */
    private Long userId;

    /**
     * 逻辑删除：0正常 1已删除
     */
    @TableLogic
    private Integer deleted;

    /**
     * 乐观锁版本号，拖动确认位置时使用
     */
    @Version
    private Integer version;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
