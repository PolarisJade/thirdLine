package com.god.thirdLine.util;

import org.springframework.web.multipart.MultipartFile;

/**
 * 对象存储统一接口，具体实现由 tl.oss.site 选择。
 */
public interface ObjectStorageUtil {

    String uploadImage(MultipartFile file, String module);

    String uploadAudio(MultipartFile file, String module);

    /** 尽力删除本站文件，跳过外链，删除失败不阻塞业务。 */
    void deleteByUrl(String url);

    boolean isOwnObject(String url);

    /** 从本站文件 URL 提取对象键，外链或异常地址返回 null。 */
    String toObjectKey(String url);
}
