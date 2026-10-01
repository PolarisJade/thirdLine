package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 举报弹幕请求参数
 *
 * @author ParlisJade
 */
@Data
public class DanmakuReportDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 被举报弹幕ID */
    private Long danmakuId;

    /** 举报理由（选填，最长 200 字符） */
    private String reason;
}
