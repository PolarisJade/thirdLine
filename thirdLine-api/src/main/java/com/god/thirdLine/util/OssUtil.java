package com.god.thirdLine.util;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.ObjectMetadata;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.config.OssProperties;
import com.god.thirdLine.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;

/**
 * 阿里云 OSS 文件上传工具，负责校验、生成对象路径并上传，返回可访问 URL
 *
 * @author ParlisJade
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OssUtil {

    /** 允许上传的图片扩展名 */
    private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "gif", "bmp", "webp");

    private static final DateTimeFormatter DATE_PATH = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    private final OSS ossClient;
    private final OssProperties ossProperties;

    /**
     * 上传图片文件
     *
     * @param file   上传的文件
     * @param module 业务模块目录，如 avatar（头像）、cover（文章封面）
     * @return 文件的可访问 URL
     */
    public String uploadImage(MultipartFile file, String module) {
        // 1. 基础校验
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ResultCode.FILE_EMPTY);
        }
        String ext = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXT.contains(ext)) {
            throw new BusinessException(ResultCode.FILE_TYPE_NOT_ALLOWED);
        }

        // 2. 生成对象存储路径：dir/module/yyyy/MM/dd/uuid.ext
        String objectKey = buildObjectKey(module, ext);

        // 3. 上传
        try (InputStream inputStream = file.getInputStream()) {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            if (StringUtils.hasText(file.getContentType())) {
                metadata.setContentType(file.getContentType());
            }
            ossClient.putObject(ossProperties.getBucketName(), objectKey, inputStream, metadata);
        } catch (IOException e) {
            log.error("文件上传 OSS 失败, objectKey={}", objectKey, e);
            throw new BusinessException(ResultCode.FILE_UPLOAD_ERROR);
        }

        return buildUrl(objectKey);
    }

    /**
     * 拼接对象存储路径
     */
    private String buildObjectKey(String module, String ext) {
        StringBuilder key = new StringBuilder();
        if (StringUtils.hasText(ossProperties.getDir())) {
            key.append(trimSlash(ossProperties.getDir())).append('/');
        }
        if (StringUtils.hasText(module)) {
            key.append(trimSlash(module)).append('/');
        }
        key.append(LocalDate.now().format(DATE_PATH)).append('/')
                .append(UUID.randomUUID().toString().replace("-", ""))
                .append('.')
                .append(ext);
        return key.toString();
    }

    /**
     * 拼接文件访问 URL，优先使用配置的自定义域名前缀
     */
    private String buildUrl(String objectKey) {
        String prefix = ossProperties.getUrlPrefix();
        if (!StringUtils.hasText(prefix)) {
            // 默认使用 https://{bucketName}.{endpoint 去协议}
            String endpoint = ossProperties.getEndpoint().replaceFirst("^https?://", "");
            prefix = "https://" + ossProperties.getBucketName() + "." + endpoint;
        }
        return trimSlash(prefix) + "/" + objectKey;
    }

    /**
     * 取出文件扩展名（小写，不含点）
     */
    private String getExtension(String filename) {
        if (!StringUtils.hasText(filename)) {
            return "";
        }
        int idx = filename.lastIndexOf('.');
        return idx < 0 ? "" : filename.substring(idx + 1).toLowerCase();
    }

    /**
     * 去除字符串首尾斜杠
     */
    private String trimSlash(String value) {
        if (value == null) {
            return "";
        }
        String result = value;
        while (result.startsWith("/")) {
            result = result.substring(1);
        }
        while (result.endsWith("/")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }
}
