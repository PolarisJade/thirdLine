package com.god.thirdLine.controller.user;


import com.god.thirdLine.common.CursorPage;
import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.query.ArticleQuery;
import com.god.thirdLine.domain.vo.ArticleVO;
import com.god.thirdLine.service.IArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 文章表 前台公开控制器
 * </p>
 * 仅提供前台浏览所需的读接口，位于 /user/** 命名空间，不做登录校验；
 * 后台管理相关读写见 {@code /admin/article}。
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
@RestController
@RequestMapping("/user/article")
@RequiredArgsConstructor
public class ArticleController {

    private final IArticleService articleService;

    /**
     * 根据ID查询文章详情（读操作，放行）
     */
    @GetMapping("/{id}")
    public Result<ArticleVO> detail(@PathVariable Long id) {
        return Result.success(articleService.getArticleDetail(id));
    }

    /**
     * 游标分页查询文章，支持关键词/分类/标签过滤（读、搜索操作，放行）
     */
    @GetMapping("/page")
    public Result<CursorPage<ArticleVO>> page(ArticleQuery query) {
        return Result.success(articleService.pageArticles(query));
    }
}
