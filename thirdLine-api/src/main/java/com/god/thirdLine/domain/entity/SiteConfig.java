package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
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
 * 站点配置表（key-value 全局开关）
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-27
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_site_config")
public class SiteConfig implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 弹幕全局开关配置键 */
    public static final String KEY_DANMAKU_ENABLED = "danmaku_enabled";

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 配置键
     */
    private String configKey;

    /**
     * 配置值
     */
    private String configValue;

    /**
     * 配置说明
     */
    private String description;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
