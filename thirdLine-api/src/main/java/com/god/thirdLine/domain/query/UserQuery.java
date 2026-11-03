package com.god.thirdLine.domain.query;

import lombok.Data;

/** 后台用户分页查询参数。 */
@Data
public class UserQuery {
    private Integer page = 1;
    private Integer size = 10;
    /** 按用户名、昵称或邮箱搜索。 */
    private String keyword;
    private Integer role;
    private Integer status;

    public Integer getPage() {
        return page == null || page < 1 ? 1 : page;
    }

    public Integer getSize() {
        return size == null || size < 1 ? 10 : Math.min(size, 100);
    }
}
