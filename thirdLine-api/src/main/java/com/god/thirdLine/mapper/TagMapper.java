package com.god.thirdLine.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.god.thirdLine.domain.entity.Tag;
import com.god.thirdLine.domain.vo.ArticleTagVO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * <p>
 * 标签表 Mapper 接口
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
public interface TagMapper extends BaseMapper<Tag> {

    /**
     * 批量查询若干文章关联的标签（用于文章列表/详情装配标签）
     *
     * @param articleIds 文章ID集合
     */
    List<ArticleTagVO> selectArticleTags(@Param("articleIds") List<Long> articleIds);
}
