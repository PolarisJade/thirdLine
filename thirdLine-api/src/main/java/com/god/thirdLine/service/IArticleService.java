package com.god.thirdLine.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.god.thirdLine.common.CursorPage;
import com.god.thirdLine.domain.dto.ArticleSaveDTO;
import com.god.thirdLine.domain.dto.ArticleUpdateDTO;
import com.god.thirdLine.domain.entity.Article;
import com.god.thirdLine.domain.query.ArticleQuery;
import com.god.thirdLine.domain.vo.ArticleVO;

/**
 * <p>
 * 文章表 服务类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
public interface IArticleService extends IService<Article> {

    /**
     * 新增文章并关联标签
     *
     * @param authorId 作者ID（当前登录用户）
     * @param dto      文章数据
     * @return 新增文章ID
     */
    Long saveArticle(Long authorId, ArticleSaveDTO dto);

    /**
     * 根据ID查询文章详情
     *
     * @param id 文章ID
     * @return 文章详情
     */
    ArticleVO getArticleDetail(Long id);

    /**
     * 游标分页查询文章
     *
     * @param query 查询条件
     * @return 游标分页结果
     */
    CursorPage<ArticleVO> pageArticles(ArticleQuery query);

    /**
     * 根据ID删除文章，并级联删除其标签关联
     *
     * @param id 文章ID
     */
    void deleteArticle(Long id);

    /**
     * 修改文章信息（tagIds 非空时整体覆盖标签关联）
     *
     * @param dto 文章数据
     */
    void updateArticle(ArticleUpdateDTO dto);
}
