package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 技术栈新增 / 修改请求参数。
 * 新增时 id 为空，修改时 id 必填。
 *
 * @author ParlisJade
 * @since 2026-10-12
 */
@Data
public class TechStackDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 技术栈ID（修改时必填） */
    private Long id;

    /** 技术栈名称 */
    private String name;

    /** 排序值，越小越靠前；新增时为空则自动排到末尾 */
    private Integer sort;

    /** 状态：0禁用/1启用，为空默认启用 */
    private Integer status;
}
