package com.god.thirdLine.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.god.thirdLine.domain.entity.ArticleTag;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * <p>
 * 文章-标签关联表 Mapper 接口
 * </p>
 *
 * @author ParlisJade
 */
public interface ArticleTagMapper extends BaseMapper<ArticleTag> {

    /**
     * 批量建立文章-标签关联：拼成一条 INSERT，避免在循环里逐条写库。
     *
     * @param relations 关联列表，调用方保证非空且已去重、无 null 元素
     * @return 插入行数
     */
    int insertBatch(@Param("relations") List<ArticleTag> relations);
}
