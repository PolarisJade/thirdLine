package com.god.thirdLine.controller.user;


import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.vo.CategoryVO;
import com.god.thirdLine.service.ICategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * <p>
 * 分类表 前台公开控制器
 * </p>
 * 仅提供前台浏览所需的读接口，位于 /user/** 命名空间，不做登录校验；
 * 后台管理相关读写见 {@code /admin/category}。
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
@RestController
@RequestMapping("/user/category")
@RequiredArgsConstructor
public class CategoryController {

    private final ICategoryService categoryService;

    /**
     * 查询所有分类（读操作，放行）
     */
    @GetMapping("/list")
    public Result<List<CategoryVO>> list() {
        return Result.success(categoryService.listCategories());
    }
}
