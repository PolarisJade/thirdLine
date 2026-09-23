package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 文章-标签关联查询投影对象，用于批量装配文章标签
 *
 * @author ParlisJade
 */
@Data
public class ArticleTagVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 文章ID */
    private Long articleId;

    /** 标签ID */
    private Long tagId;

    /** 标签名称 */
    private String tagName;
}
