package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 留言墙-审核
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallNoteAuditDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 审核结果：1通过 2拒绝 */
    private Integer auditStatus;

    /** 审核意见；拒绝时必填，通过时选填 */
    private String auditRemark;
}
