package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;

import java.io.Serial;
import java.time.LocalDateTime;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * <p>
 * 作品集表
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-24
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_portfolio")
public class Portfolio implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 作品标题
     */
    private String title;

    /**
     * 作品摘要（列表卡片展示）
     */
    private String summary;

    /**
     * 封面图URL
     */
    private String coverImage;

    /**
     * 技术栈/工具，逗号分隔，如 React,Spring Boot,MySQL
     */
    private String techStack;

    /**
     * 本人担任角色，如 前端负责人/独立开发
     */
    private String role;

    /**
     * 项目周期，如 2025-01 ~ 2025-06
     */
    private String period;

    /**
     * 在线演示地址
     */
    private String demoUrl;

    /**
     * 源码仓库地址
     */
    private String repoUrl;

    /**
     * 状态：0草稿/1已发布/2已删除
     */
    private Integer status;

    /**
     * 发布时间
     */
    private LocalDateTime publishTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
