package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 网站基本信息统计 VO
 *
 * @author ParlisJade
 */
@Data
public class SiteStatsVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 已发布文章总数 */
    private Long articleCount;

    /** 分类总数 */
    private Long categoryCount;

    /** 标签总数 */
    private Long tagCount;

    /** 相册照片总数（仅统计显示状态） */
    private Long photoCount;
}