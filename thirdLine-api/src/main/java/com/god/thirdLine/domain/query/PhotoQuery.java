package com.god.thirdLine.domain.query;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 照片分页查询条件（标准 page/size 分页）
 *
 * @author ParlisJade
 */
@Data
public class PhotoQuery implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 页码，从 1 开始 */
    private Integer page = 1;

    /** 每页条数，默认 12，最大 100 */
    private Integer size = 12;

    /** 状态：0隐藏/1显示，为空则不限制（前台仅传 1） */
    private Integer status;

    public Integer getPage() {
        if (page == null || page <= 0) {
            return 1;
        }
        return page;
    }

    public Integer getSize() {
        if (size == null || size <= 0) {
            return 12;
        }
        return Math.min(size, 100);
    }
}
