package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 弹幕举报记录展示对象（后台举报处理列表）
 *
 * @author ParlisJade
 */
@Data
public class DanmakuReportVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 举报记录ID */
    private Long id;

    /** 被举报弹幕ID */
    private Long danmakuId;

    /** 被举报弹幕内容 */
    private String danmakuContent;

    /** 被举报弹幕发送者昵称 */
    private String danmakuNickname;

    /** 举报人昵称 */
    private String reporterNickname;

    /** 举报理由 */
    private String reason;

    /** 处理状态：0待处理 1已处理 */
    private Integer status;

    private LocalDateTime createTime;
}
