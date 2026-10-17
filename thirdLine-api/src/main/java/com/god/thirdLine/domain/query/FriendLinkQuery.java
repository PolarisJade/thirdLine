package com.god.thirdLine.domain.query;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 友链分页查询条件（标准 page/size 分页，后台使用）。
 *
 * @author ParlisJade
 * @since 2026-10-17
 */
@Data
public class FriendLinkQuery implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 页码，从 1 开始 */
    private Integer page = 1;

    /** 每页条数，默认 10，最大 100 */
    private Integer size = 10;

    /** 关键词，对站点名称、地址、描述做模糊匹配 */
    private String keyword;

    /** 审核状态：0待审核/1已通过/2已拒绝，为空则不限制 */
    private Integer auditStatus;

    /** 显示状态：0隐藏/1显示，为空则不限制 */
    private Integer status;

    /** 来源：0管理员添加/1访客申请，为空则不限制 */
    private Integer source;

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
