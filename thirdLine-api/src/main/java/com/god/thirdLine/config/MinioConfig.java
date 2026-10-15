package com.god.thirdLine.config;

import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;

/** 仅启用 MinIO 时注册客户端，首次使用时检查配置。 */
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "tl.oss", name = "site", havingValue = "minio")
public class MinioConfig {

    private final MinioProperties minioProperties;

    @Bean
    @Lazy
    public MinioClient minioClient() {
        if (!StringUtils.hasText(minioProperties.getEndpoint())
                || !StringUtils.hasText(minioProperties.getAccessKey())
                || !StringUtils.hasText(minioProperties.getSecretKey())
                || !StringUtils.hasText(minioProperties.getBucketName())) {
            throw new IllegalStateException(
                    "请填写 minio.endpoint、minio.access-key、minio.secret-key、minio.bucket-name");
        }
        return MinioClient.builder()
                .endpoint(minioProperties.getEndpoint())
                .credentials(minioProperties.getAccessKey(), minioProperties.getSecretKey())
                .build();
    }
}
