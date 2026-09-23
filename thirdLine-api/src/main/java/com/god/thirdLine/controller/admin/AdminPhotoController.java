package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.PhotoDTO;
import com.god.thirdLine.domain.query.PhotoQuery;
import com.god.thirdLine.domain.vo.PhotoVO;
import com.god.thirdLine.service.IPhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 照片表 后台管理控制器
 * </p>
 * 位于 /admin/** 命名空间，读写操作均经 JWT 拦截器校验登录。
 *
 * @author ParlisJade
 * @since 2026-09-21
 */
@RestController
@RequestMapping("/admin/photo")
@RequiredArgsConstructor
public class AdminPhotoController {

    private final IPhotoService photoService;

    /**
     * 分页查询照片（可按状态过滤，含隐藏照片）
     */
    @GetMapping("/page")
    public Result<PageResult<PhotoVO>> page(PhotoQuery query) {
        return Result.success(photoService.pagePhotos(query));
    }

    /**
     * 根据ID查询照片详情
     */
    @GetMapping("/{id}")
    public Result<PhotoVO> detail(@PathVariable Long id) {
        return Result.success(photoService.getPhotoDetail(id));
    }

    /**
     * 新增照片，sort 未指定时自动追加到末尾
     */
    @PostMapping
    public Result<Long> save(@RequestBody PhotoDTO dto) {
        return Result.success(photoService.savePhoto(dto));
    }

    /**
     * 修改照片（图片、标题、描述、排序、显隐）
     */
    @PutMapping
    public Result<Void> update(@RequestBody PhotoDTO dto) {
        photoService.updatePhoto(dto);
        return Result.success();
    }

    /**
     * 删除照片
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        photoService.deletePhoto(id);
        return Result.success();
    }
}
