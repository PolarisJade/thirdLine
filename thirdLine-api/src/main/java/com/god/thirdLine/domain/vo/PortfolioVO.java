package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 作品集展示对象
 *
 * @author ParlisJade
 */
@Data
public class PortfolioVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    private String title;

    private String summary;

    private String coverImage;

    /** 关联的技术栈（来自 tl_portfolio_tech_stack + tl_tech_stack，按 sort 升序） */
    private List<TechStackVO> techStacks;

    private String role;

    private String period;

    private String demoUrl;

    private String repoUrl;

    /** 状态：0草稿/1已发布/2已删除 */
    private Integer status;

    private LocalDateTime publishTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
