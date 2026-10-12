package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;

/**
 * <p>
 * 作品-技术栈关联表（结构对齐 tl_article_tag）
 * </p>
 *
 * @author ParlisJade
 * @since 2026-10-12
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_portfolio_tech_stack")
public class PortfolioTechStack implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 作品ID，关联 tl_portfolio
     */
    private Long portfolioId;

    /**
     * 技术栈ID，关联 tl_tech_stack
     */
    private Long techStackId;
}
