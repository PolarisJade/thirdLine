package com.god.thirdLine.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.god.thirdLine.domain.entity.Article;
import com.god.thirdLine.domain.query.ArticleQuery;
import com.god.thirdLine.domain.vo.ArticleVO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * <p>
 * 文章表 Mapper 接口
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
public interface ArticleMapper extends BaseMapper<Article> {

    /**
     * 游标分页查询文章列表（含作者昵称、分类名称）
     *
     * @param query 查询条件
     * @param limit 实际读取条数（多读一条用于判断是否还有下一页）
     */
    List<ArticleVO> selectArticlePage(@Param("q") ArticleQuery query, @Param("limit") int limit);

    /**
     * 根据ID查询文章详情（含正文、作者昵称、分类名称）
     */
    ArticleVO selectArticleDetail(@Param("id") Long id);
}
