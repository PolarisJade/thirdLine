package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * <p>
 * 技术栈字典表（可跨作品复用的技术条目，结构对齐 tl_tag）
 * </p>
 *
 * @author ParlisJade
 * @since 2026-10-12
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_tech_stack")
public class TechStack implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 状态：启用（前台可见、可选） */
    public static final int STATUS_ENABLED = 1;

    /** 状态：禁用 */
    public static final int STATUS_DISABLED = 0;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 技术栈名称，如 Spring Boot / React / MySQL（唯一）
     */
    private String name;

    /**
     * 排序值，越小越靠前
     */
    private Integer sort;

    /**
     * 状态：0禁用/1启用
     */
    private Integer status;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
