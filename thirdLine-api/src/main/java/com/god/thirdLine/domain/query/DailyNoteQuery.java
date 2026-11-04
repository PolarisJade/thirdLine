package com.god.thirdLine.domain.query;

import lombok.Data;

@Data
public class DailyNoteQuery {
    private Integer page = 1;
    private Integer size = 10;
    private Integer publishStatus;
    public Integer getPage() { return page == null || page < 1 ? 1 : page; }
    public Integer getSize() { return size == null || size < 1 ? 10 : Math.min(size, 50); }
}
