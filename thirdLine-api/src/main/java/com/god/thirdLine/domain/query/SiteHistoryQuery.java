package com.god.thirdLine.domain.query;

import lombok.Data;

@Data
public class SiteHistoryQuery {
    private Integer page = 1;
    private Integer size = 10;
    private String keyword;
    private Integer updateType;
    private Integer publishStatus;
    private Integer status;

    public Integer getPage() { return page == null || page < 1 ? 1 : page; }
    public Integer getSize() { return size == null || size < 1 ? 10 : Math.min(size, 100); }
}

