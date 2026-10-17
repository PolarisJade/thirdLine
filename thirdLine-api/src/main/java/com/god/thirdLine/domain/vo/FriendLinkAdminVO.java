package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 友链后台管理对象。
 * <p>
 * 相比 {@link FriendLinkVO} 多出申请人邮箱、来源、审核信息与内部备注，
 * 供后台列表与编辑回填使用。
 *
 * @author ParlisJade
 * @since 2026-10-17
 */
@Data
public class FriendLinkAdminVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    private String name;

    private String url;

    private String avatar;

    private String description;

    /** 申请人联系邮箱，仅后台可见 */
    private String email;

    /** 申请用户ID，游客申请时为 null */
    private Long applyUserId;

    /** 来源：0管理员添加 1访客申请 */
    private Integer source;

    /** 审核状态：0待审核 1已通过 2已拒绝 */
    private Integer auditStatus;

    /** 拒绝原因，审核不通过时填写 */
    private String rejectReason;

    /** 显示状态：0隐藏 1显示 */
    private Integer status;

    /** 后台内部备注 */
    private String remark;

    /** 审核时间 */
    private LocalDateTime auditTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
