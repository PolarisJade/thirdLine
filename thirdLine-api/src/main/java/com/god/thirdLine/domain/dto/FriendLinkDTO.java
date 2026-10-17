package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 友链新增 / 修改请求参数（后台）。
 * 新增时 id 为空，修改时 id 必填；
 * 修改时字段为 null 表示不动原值，图标 / 描述 / 邮箱 / 备注传空串表示清空。
 *
 * @author ParlisJade
 * @since 2026-10-17
 */
@Data
public class FriendLinkDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 友链ID（修改时必填） */
    private Long id;

    /** 站点名称（必填，最长 64） */
    private String name;

    /** 站点地址（必填，http/https，最长 255） */
    private String url;

    /** 站点图标/头像URL（选填，最长 500） */
    private String avatar;

    /** 站点描述（选填，最长 255） */
    private String description;

    /** 联系邮箱（选填，仅后台可见） */
    private String email;

    /** 显示状态：0隐藏/1显示，新增时不传默认 1 */
    private Integer status;

    /** 后台内部备注（选填，前台不展示） */
    private String remark;
}
