package com.god.thirdLine.domain.query;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 文章游标分页查询条件
 *
 * @author ParlisJade
 */
@Data
public class ArticleQuery implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 关键词，对标题与摘要进行模糊匹配 */
    private String keyword;

    /** 分类ID */
    private Long categoryId;

    /** 标签ID */
    private Long tagId;

    /** 状态：0草稿/1已发布/2已删除，为空则不限制 */
    private Integer status;

    /** 游标：上一页最后一条记录的ID，首页传空 */
    private Long cursor;

    /** 每页条数，默认 10，最大 50 */
    private Integer size = 10;

    public Integer getSize() {
        if (size == null || size <= 0) {
            return 10;
        }
        return Math.min(size, 50);
    }
}
