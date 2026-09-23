package com.god.thirdLine.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT 相关配置，对应 application.yml 中 jwt.* 配置项
 *
 * @author ParlisJade
 */
@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /** 签名密钥（HS256 要求长度不少于 32 字节） */
    private String secret = "thirdLine-blog-default-secret-key-please-change-in-production";

    /** token 过期时间，单位：毫秒，默认 24 小时 */
    private Long expiration = 86400000L;

    /** 滑动续期阈值：剩余有效期不足该值（毫秒）时签发新 token，默认 6 小时 */
    private Long refreshThreshold = 21600000L;

    /** 存放 token 的请求头名称 */
    private String header = "Authorization";

    /** token 前缀 */
    private String tokenPrefix = "Bearer ";

    /** 续期后新 token 的响应头名称，前端据此更新本地存储 */
    private String refreshHeader = "X-Refresh-Token";
}
