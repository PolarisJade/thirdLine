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
 * 友情链接表
 * </p>
 * 同时承载「已展示友链」与「待审核申请」两种形态：
 * 管理员直接添加的 source=0 且审核态为已通过；访客提交的 source=1 且审核态为待审核。
 * 前台可见条件恒为 status=1 且 auditStatus=1。
 *
 * @author ParlisJade
 * @since 2026-10-17
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_friend_link")
public class FriendLink implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 审核状态：待审核 */
    public static final int AUDIT_PENDING = 0;

    /** 审核状态：已通过 */
    public static final int AUDIT_APPROVED = 1;

    /** 审核状态：已拒绝 */
    public static final int AUDIT_REJECTED = 2;

    /** 显示状态：隐藏（审核通过后由管理员临时下线） */
    public static final int STATUS_HIDDEN = 0;

    /** 显示状态：显示 */
    public static final int STATUS_VISIBLE = 1;

    /** 来源：管理员添加 */
    public static final int SOURCE_ADMIN = 0;

    /** 来源：访客申请 */
    public static final int SOURCE_APPLY = 1;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 站点名称
     */
    private String name;

    /**
     * 站点地址（http/https，落库前统一去掉尾部斜杠）
     */
    private String url;

    /**
     * 站点图标/头像URL，为空时前台可按站点名首字母兜底
     */
    private String avatar;

    /**
     * 站点描述/一句话简介
     */
    private String description;

    /**
     * 申请人联系邮箱，仅后台可见，用于回信告知审核结果
     */
    private String email;

    /**
     * 申请用户ID，关联 tl_user.id；管理员添加或游客未登录申请时为 null
     */
    private Long applyUserId;

    /**
     * 来源：0管理员添加 1访客申请
     */
    private Integer source;

    /**
     * 审核状态：0待审核 1已通过 2已拒绝
     */
    private Integer auditStatus;

    /**
     * 拒绝原因，审核不通过时填写
     */
    private String rejectReason;

    /**
     * 显示状态：0隐藏 1显示
     */
    private Integer status;

    /**
     * 后台内部备注，前台不展示
     */
    private String remark;

    /**
     * 审核时间，通过/拒绝时写入
     */
    private LocalDateTime auditTime;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
