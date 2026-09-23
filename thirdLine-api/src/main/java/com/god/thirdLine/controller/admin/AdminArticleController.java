package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.CursorPage;
import com.god.thirdLine.common.Result;
import com.god.thirdLine.context.UserContext;
import com.god.thirdLine.domain.dto.ArticleSaveDTO;
import com.god.thirdLine.domain.dto.ArticleUpdateDTO;
import com.god.thirdLine.domain.query.ArticleQuery;
import com.god.thirdLine.domain.vo.ArticleVO;
import com.god.thirdLine.service.IArticleService;
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
 * 文章表 后台管理控制器
 * </p>
 * 后台管理端专用，位于 /admin/** 命名空间，读写操作均经 JWT 拦截器校验登录。
 *
 * @author ParlisJade
 * @since 2026-09-21
 */
@RestController
@RequestMapping("/admin/article")
@RequiredArgsConstructor
public class AdminArticleController {

    private final IArticleService articleService;

    /**
     * 游标分页查询文章（后台可按状态过滤草稿 / 已发布）
     */
    @GetMapping("/page")
    public Result<CursorPage<ArticleVO>> page(ArticleQuery query) {
        return Result.success(articleService.pageArticles(query));
    }

    /**
     * 根据ID查询文章详情（编辑回填用）
     */
    @GetMapping("/{id}")
    public Result<ArticleVO> detail(@PathVariable Long id) {
        return Result.success(articleService.getArticleDetail(id));
    }

    /**
     * 新增文章
     */
    @PostMapping
    public Result<Long> save(@RequestBody ArticleSaveDTO dto) {
        return Result.success(articleService.saveArticle(UserContext.getUserId(), dto));
    }

    /**
     * 修改文章
     */
    @PutMapping
    public Result<Void> update(@RequestBody ArticleUpdateDTO dto) {
        articleService.updateArticle(dto);
        return Result.success();
    }

    /**
     * 删除文章（级联删除标签关联）
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return Result.success();
    }
}
