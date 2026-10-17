package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

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
     * 技术栈通过 tl_portfolio_tech_stack 关联 tl_tech_stack 维护，
     * 不再以逗号分隔字符串存在本表。
     */

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

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
