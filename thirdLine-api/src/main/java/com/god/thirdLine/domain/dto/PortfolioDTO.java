package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 作品集新增 / 修改请求参数。
 * 新增时 id 为空，修改时 id 必填。
 *
 * @author ParlisJade
 */
@Data
public class PortfolioDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 作品ID（修改时必填） */
    private Long id;

    /** 作品标题（必填） */
    private String title;

    /** 作品摘要（列表卡片展示） */
    private String summary;

    /** 封面图URL */
    private String coverImage;

    /** 技术栈/工具，逗号分隔，如 React,Spring Boot,MySQL */
    private String techStack;

    /** 本人担任角色，如 前端负责人/独立开发 */
    private String role;

    /** 项目周期，如 2025-01 ~ 2025-06 */
    private String period;

    /** 在线演示地址 */
    private String demoUrl;

    /** 源码仓库地址 */
    private String repoUrl;

    /** 状态：0草稿/1已发布，默认草稿 */
    private Integer status;
}
