package com.god.thirdLine.config;

import lombok.Data;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** MinIO 配置，对应 minio.*。 */
@Data
@Component
@ConditionalOnProperty(prefix = "tl.oss", name = "site", havingValue = "minio")
@ConfigurationProperties(prefix = "minio")
public class MinioProperties {

    /** S3 API 地址，例如 http://127.0.0.1:9000，不是控制台地址。 */
    private String endpoint;

    private String accessKey;

    private String secretKey;

    /** 已创建的存储桶名称。 */
    private String bucketName;

    /** 文件访问前缀，需包含桶路径；留空使用 endpoint/bucketName。 */
    private String urlPrefix;

    private String dir = "blog";
}
