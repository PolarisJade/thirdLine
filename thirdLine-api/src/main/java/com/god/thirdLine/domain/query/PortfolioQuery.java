package com.god.thirdLine.domain.query;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 作品集分页查询条件（标准 page/size 分页）
 *
 * @author ParlisJade
 */
@Data
public class PortfolioQuery implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 页码，从 1 开始 */
    private Integer page = 1;

    /** 每页条数，默认 10，最大 100 */
    private Integer size = 10;

    /** 关键词，对标题与摘要进行模糊匹配 */
    private String keyword;

    /** 状态：0草稿/1已发布/2已删除，为空则不限制（前台仅传 1） */
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
