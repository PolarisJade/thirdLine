package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 留言墙-举报
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallNoteReportDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 举报类型：1垃圾广告 2辱骂攻击 3色情低俗 4政治敏感 5违法信息 6其他 */
    private Integer reasonType;

    /** 补充说明，选填 */
    private String reason;
}
