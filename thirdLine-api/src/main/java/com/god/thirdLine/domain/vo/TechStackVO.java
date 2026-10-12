package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 技术栈展示对象
 *
 * @author ParlisJade
 * @since 2026-10-12
 */
@Data
public class TechStackVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    private String name;

    /** 排序值，越小越靠前 */
    private Integer sort;

    /** 状态：0禁用/1启用 */
    private Integer status;
}
