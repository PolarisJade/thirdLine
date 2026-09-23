package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.CategoryDTO;
import com.god.thirdLine.domain.vo.CategoryVO;
import com.god.thirdLine.service.ICategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * <p>
 * 分类表 后台管理控制器
 * </p>
 * 位于 /admin/** 命名空间，读写操作均经 JWT 拦截器校验登录。
 *
 * @author ParlisJade
 * @since 2026-09-21
 */
@RestController
@RequestMapping("/admin/category")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final ICategoryService categoryService;

    /**
     * 查询所有分类
     */
    @GetMapping("/list")
    public Result<List<CategoryVO>> list() {
        return Result.success(categoryService.listCategories());
    }

    /**
     * 新增分类（名称不允许重复）
     */
    @PostMapping
    public Result<Long> save(@RequestBody CategoryDTO dto) {
        return Result.success(categoryService.saveCategory(dto));
    }

    /**
     * 修改分类名称与排序
     */
    @PutMapping
    public Result<Void> update(@RequestBody CategoryDTO dto) {
        categoryService.updateCategory(dto);
        return Result.success();
    }

    /**
     * 删除分类（存在关联文章时不可删除）
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return Result.success();
    }
}
