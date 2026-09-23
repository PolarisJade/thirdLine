package com.god.thirdLine.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 阿里云 OSS 相关配置，对应 application.yml 中 aliyun.oss.* 配置项
 *
 * @author ParlisJade
 */
@Data
@Component
@ConfigurationProperties(prefix = "aliyun.oss")
public class OssProperties {

    /** 地域节点，例如：https://oss-cn-hangzhou.aliyuncs.com */
    private String endpoint;

    /** 访问密钥 AccessKeyId */
    private String accessKeyId;

    /** 访问密钥 AccessKeySecret */
    private String accessKeySecret;

    /** 存储空间名称 BucketName */
    private String bucketName;

    /**
     * 访问域名前缀，用于拼接文件访问 URL。
     * 留空时默认使用 https://{bucketName}.{endpoint 去协议}
     * 若绑定了自定义域名（CNAME），填写如：https://static.example.com
     */
    private String urlPrefix;

    /** 上传文件的目录前缀，例如：blog（不带首尾斜杠） */
    private String dir = "blog";
}
