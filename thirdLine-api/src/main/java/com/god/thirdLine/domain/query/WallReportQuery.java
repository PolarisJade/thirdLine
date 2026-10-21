package com.god.thirdLine.domain.query;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 留言墙-后台举报分页查询条件
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallReportQuery implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Integer page = 1;

    private Integer size = 10;

    /** 处理状态：0待处理/1成立/2不成立，为空不限制 */
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
