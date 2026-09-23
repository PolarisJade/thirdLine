package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 标签新增 / 修改请求参数。
 * 新增时 id 为空，修改时 id 必填。
 *
 * @author ParlisJade
 */
@Data
public class TagDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 标签ID（修改时必填） */
    private Long id;

    /** 标签名称 */
    private String name;
}
