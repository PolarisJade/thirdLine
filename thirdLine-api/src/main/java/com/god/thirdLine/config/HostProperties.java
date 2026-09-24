package com.god.thirdLine.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 站主个人介绍配置，对应 application-local.yml 中 tl.host.* 配置项
 *
 * @author ParlisJade
 */
@Data
@Component
@ConfigurationProperties(prefix = "tl.host")
public class HostProperties {

    /** 站主昵称 */
    private String nickname;

    /** 联系邮箱 */
    private String email;

    /** GitHub 主页链接 */
    private String github;

    /** 头像 URL */
    private String avatar;
}
