package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 分类新增 / 修改请求参数。
 * 新增时 id 为空，修改时 id 必填。
 *
 * @author ParlisJade
 */
@Data
public class CategoryDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 分类ID（修改时必填） */
    private Long id;

    /** 分类名称 */
    private String name;

    /** 排序权重，越小越靠前 */
    private Integer sort;
}
