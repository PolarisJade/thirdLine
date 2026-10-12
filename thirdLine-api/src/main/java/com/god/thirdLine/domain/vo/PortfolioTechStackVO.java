package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 作品-技术栈关联查询投影对象，用于批量装配作品的技术栈
 *
 * @author ParlisJade
 * @since 2026-10-12
 */
@Data
public class PortfolioTechStackVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 作品ID */
    private Long portfolioId;

    /** 技术栈ID */
    private Long techStackId;

    /** 技术栈名称 */
    private String techStackName;

    /** 技术栈排序值 */
    private Integer sort;
}
