package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 站主个人介绍 VO（信息来自配置文件 tl.host.*）
 *
 * @author ParlisJade
 */
@Data
public class SiteProfileVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 站主昵称 */
    private String nickname;

    /** 联系邮箱 */
    private String email;

    /** GitHub 主页链接 */
    private String github;

    /** 头像 URL */
    private String avatar;
}
