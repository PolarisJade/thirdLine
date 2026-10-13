package com.god.thirdLine.util;

import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.config.MinioProperties;
import com.god.thirdLine.exception.BusinessException;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/** MinIO 文件工具，保持与阿里云 OSS 相同的上传和清理约定。 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "tl.oss", name = "site", havingValue = "minio")
public class MinioUtil implements ObjectStorageUtil {

    private static final Set<String> ALLOWED_IMAGE_EXT = Set.of("jpg", "jpeg", "png", "gif", "bmp", "webp");
    private static final Set<String> ALLOWED_AUDIO_EXT = Set.of("mp3", "wav", "flac", "m4a", "aac", "ogg");
    private static final DateTimeFormatter DATE_PATH = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    // 延迟获取客户端，让尚未填写 MinIO 占位配置时也能启动其他业务。
    private final ObjectProvider<MinioClient> minioClientProvider;
    private final MinioProperties minioProperties;

    @Override
    public String uploadImage(MultipartFile file, String module) {
        return doUpload(file, module, ALLOWED_IMAGE_EXT);
    }

    @Override
    public String uploadAudio(MultipartFile file, String module) {
        return doUpload(file, module, ALLOWED_AUDIO_EXT);
    }

    @Override
    public void deleteByUrl(String url) {
        String objectKey = toObjectKey(url);
        if (objectKey == null) {
            return;
        }
        try {
            minioClientProvider.getObject().removeObject(RemoveObjectArgs.builder()
                    .bucket(minioProperties.getBucketName())
                    .object(objectKey)
                    .build());
        } catch (Exception e) {
            log.warn("删除 MinIO 文件失败, objectKey={}", objectKey, e);
        }
    }

    @Override
    public boolean isOwnObject(String url) {
        return toObjectKey(url) != null;
    }

    @Override
    public String toObjectKey(String url) {
        if (!StringUtils.hasText(url)) {
            return null;
        }
        String prefix = getUrlPrefix();
        if (!StringUtils.hasText(prefix) || !url.startsWith(prefix + "/")) {
            return null;
        }
        String objectKey = url.substring(prefix.length() + 1);
        if (!StringUtils.hasText(objectKey) || objectKey.contains("?") || objectKey.contains("#")) {
            return null;
        }
        return objectKey;
    }

    private String doUpload(MultipartFile file, String module, Set<String> allowedExt) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ResultCode.FILE_EMPTY);
        }
        String ext = getExtension(file.getOriginalFilename());
        if (!allowedExt.contains(ext)) {
            throw new BusinessException(ResultCode.FILE_TYPE_NOT_ALLOWED);
        }
        String objectKey = buildObjectKey(module, ext);
        try (InputStream inputStream = file.getInputStream()) {
            minioClientProvider.getObject().putObject(PutObjectArgs.builder()
                    .bucket(minioProperties.getBucketName())
                    .object(objectKey)
                    .stream(inputStream, file.getSize(), -1)
                    .contentType(StringUtils.hasText(file.getContentType())
                            ? file.getContentType() : "application/octet-stream")
                    .build());
            return getUrlPrefix() + "/" + objectKey;
        } catch (Exception e) {
            log.error("文件上传 MinIO 失败, objectKey={}", objectKey, e);
            throw new BusinessException(ResultCode.FILE_UPLOAD_ERROR);
        }
    }

    private String buildObjectKey(String module, String ext) {
        StringBuilder key = new StringBuilder();
        String dir = trimSlash(minioProperties.getDir());
        if (StringUtils.hasText(dir)) {
            key.append(dir).append('/');
        }
        String modulePath = trimSlash(module);
        if (StringUtils.hasText(modulePath)) {
            key.append(modulePath).append('/');
        }
        return key.append(LocalDate.now().format(DATE_PATH)).append('/')
                .append(UUID.randomUUID().toString().replace("-", ""))
                .append('.').append(ext).toString();
    }

    private String getUrlPrefix() {
        if (StringUtils.hasText(minioProperties.getUrlPrefix())) {
            return trimSlash(minioProperties.getUrlPrefix());
        }
        if (!StringUtils.hasText(minioProperties.getEndpoint())
                || !StringUtils.hasText(minioProperties.getBucketName())) {
            return null;
        }
        return trimSlash(minioProperties.getEndpoint()) + "/" + minioProperties.getBucketName();
    }

    private String getExtension(String filename) {
        if (!StringUtils.hasText(filename)) {
            return "";
        }
        int index = filename.lastIndexOf('.');
        return index < 0 ? "" : filename.substring(index + 1).toLowerCase(Locale.ROOT);
    }

    private String trimSlash(String value) {
        return value == null ? "" : value.replaceAll("^/+|/+$", "");
    }
}
