package com.god.thirdLine.domain.query;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 文章标准分页查询条件（管理端表格用：page/size + 筛选）。
 *
 * <p>与游标分页的 {@link ArticleQuery} 相互独立：那个只认 cursor，本类只认 page，
 * 两者共用同一套筛选字段，新增标准分页接口不影响原有游标查询。</p>
 *
 * @author ParlisJade
 */
@Data
public class ArticlePageQuery implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 页码，从 1 开始 */
    private Integer page = 1;

    /** 每页条数，默认 10，最大 100 */
    private Integer size = 10;

    /** 关键词，对标题与摘要进行模糊匹配 */
    private String keyword;

    /** 分类ID */
    private Long categoryId;

    /** 标签ID */
    private Long tagId;

    /** 状态：0草稿/1已发布/2已删除，为空则不限制 */
    private Integer status;

    public Integer getPage() {
        if (page == null || page <= 0) {
            return 1;
        }
        return page;
    }

    public Integer getSize() {
        if (size == null || size <= 0) {
            return 10;
        }
        return Math.min(size, 100);
    }
}
