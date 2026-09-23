package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.util.OssUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * <p>
 * 文件上传 后台管理控制器（阿里云 OSS）
 * </p>
 * 用于上传用户头像、文章封面、相册图片等，返回可访问 URL。
 * 位于 /admin/** 命名空间，须登录方可上传。
 *
 * @author ParlisJade
 * @since 2026-09-21
 */
@RestController
@RequestMapping("/admin/file")
@RequiredArgsConstructor
public class AdminFileController {

    private final OssUtil ossUtil;

    /**
     * 上传图片
     *
     * @param file   图片文件
     * @param module 业务模块目录，如 avatar（头像）、cover（文章封面），默认 common
     * @return 图片访问 URL
     */
    @PostMapping("/upload")
    public Result<String> upload(@RequestParam("file") MultipartFile file,
                                 @RequestParam(value = "module", required = false, defaultValue = "common") String module) {
        return Result.success(ossUtil.uploadImage(file, module));
    }
}
