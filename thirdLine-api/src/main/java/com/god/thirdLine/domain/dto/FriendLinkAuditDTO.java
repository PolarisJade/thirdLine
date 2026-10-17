package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 友链审核请求参数（后台）。
 *
 * @author ParlisJade
 * @since 2026-10-17
 */
@Data
public class FriendLinkAuditDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 友链ID（必填） */
    private Long id;

    /** 审核结果：1通过 / 2拒绝（必填，不允许改回待审核） */
    private Integer auditStatus;

    /** 拒绝原因，auditStatus=2 时必填，最长 200 */
    private String rejectReason;
}
