package com.god.thirdLine.domain.query;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 留言墙-后台留言分页查询条件
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallNoteQuery implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 页码，从 1 开始 */
    private Integer page = 1;

    /** 每页条数，默认 10，最大 100 */
    private Integer size = 10;

    /** 关键词，对正文做模糊匹配 */
    private String keyword;

    /** 审核状态：0待审核/1已通过/2已拒绝，为空不限制 */
    private Integer auditStatus;

    /** 显示状态：0隐藏/1显示，为空不限制 */
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
