package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;

/**
 * <p>
 * 文章-标签关联表
 * </p>
 *
 * @author ParlisJade
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_article_tag")
public class ArticleTag implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 文章ID，关联 tl_article
     */
    private Long articleId;

    /**
     * 标签ID，关联 tl_tag
     */
    private Long tagId;
}
