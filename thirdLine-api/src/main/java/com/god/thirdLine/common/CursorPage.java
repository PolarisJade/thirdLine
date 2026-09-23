package com.god.thirdLine.common;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 游标分页结果封装
 *
 * @author ParlisJade
 */
@Data
public class CursorPage<T> implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 当前页数据 */
    private List<T> records;

    /** 下一页游标（本页最后一条记录的排序字段值），无更多数据时为 null */
    private Long nextCursor;

    /** 是否还有更多数据 */
    private Boolean hasMore;

    public CursorPage() {
    }

    public CursorPage(List<T> records, Long nextCursor, Boolean hasMore) {
        this.records = records;
        this.nextCursor = nextCursor;
        this.hasMore = hasMore;
    }
}
