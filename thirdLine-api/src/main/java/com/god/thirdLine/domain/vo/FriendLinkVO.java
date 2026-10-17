package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 友链前台展示对象。
 * <p>
 * 刻意只包含前台能公开的字段：申请人邮箱、后台备注、审核状态、拒绝原因都不在这里，
 * 避免一个列表接口把内部信息带出去。
 *
 * @author ParlisJade
 * @since 2026-10-17
 */
@Data
public class FriendLinkVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    private String name;

    private String url;

    private String avatar;

    private String description;
}
