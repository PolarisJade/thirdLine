package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 留言墙-信纸颜色
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallColorVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 颜色 key，落库存这个值 */
    private String key;

    /** 展示名称 */
    private String label;

    /** 色值，如 #FFD9E3 */
    private String color;
}
