package com.god.thirdLine.controller.user;


import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.vo.PhotoVO;
import com.god.thirdLine.service.IPhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * <p>
 * 照片表 前台公开控制器
 * </p>
 * 仅提供前台相册所需的读接口，位于 /user/** 命名空间，不做登录校验；
 * 后台相册管理（分页/增删改）见 {@code /admin/photo}。
 *
 * @author ParlisJade
 * @since 2026-09-21
 */
@RestController
@RequestMapping("/user/photo")
@RequiredArgsConstructor
public class PhotoController {

    private final IPhotoService photoService;

    /**
     * 查询全部显示的照片，按排序升序（前台相册翻页，读操作放行）
     */
    @GetMapping("/list")
    public Result<List<PhotoVO>> list() {
        return Result.success(photoService.listVisiblePhotos());
    }
}
