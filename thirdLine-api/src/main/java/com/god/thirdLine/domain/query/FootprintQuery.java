package com.god.thirdLine.domain.query;

import lombok.Data;

/**
 * 足迹分页查询条件（标准 page/size 分页）。
 *
 * @author ParlisJade
 */
@Data
public class FootprintQuery {

    private Integer page = 1;

    private Integer size = 10;

    /** 按城市名 / 省份名模糊搜索 */
    private String keyword;

    /** 0 草稿 / 1 已发布 */
    private Integer publishStatus;

    /** 0 隐藏 / 1 显示 */
    private Integer status;

    public Integer getPage() {
        return page == null || page < 1 ? 1 : page;
    }

    public Integer getSize() {
        return size == null || size < 1 ? 10 : Math.min(size, 100);
    }
}
