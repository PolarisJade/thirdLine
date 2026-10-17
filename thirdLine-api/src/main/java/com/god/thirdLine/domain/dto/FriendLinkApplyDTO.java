package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 友链申请请求参数（前台）。
 * 只暴露前台允许填写的字段，来源、审核状态等由后端决定，不接受前端传入。
 *
 * @author ParlisJade
 * @since 2026-10-17
 */
@Data
public class FriendLinkApplyDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 站点名称（必填，最长 64） */
    private String name;

    /** 站点地址（必填，http/https，最长 255） */
    private String url;

    /** 站点图标/头像URL（选填） */
    private String avatar;

    /** 站点描述（选填，最长 255） */
    private String description;

    /** 联系邮箱（选填，审核结果回信使用，仅后台可见） */
    private String email;
}
