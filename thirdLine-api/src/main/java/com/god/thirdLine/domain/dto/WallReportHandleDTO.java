package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 留言墙-举报处理
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallReportHandleDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 处理结果：1举报成立 2举报不成立 */
    private Integer status;

    /** 处理备注，选填 */
    private String handleRemark;
}
