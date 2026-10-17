package com.god.thirdLine.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.god.thirdLine.domain.entity.PortfolioTechStack;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * <p>
 * 作品-技术栈关联表 Mapper 接口
 * </p>
 *
 * @author ParlisJade
 * @since 2026-10-12
 */
public interface PortfolioTechStackMapper extends BaseMapper<PortfolioTechStack> {

    /**
     * 批量建立作品-技术栈关联：拼成一条 INSERT，避免在循环里逐条写库。
     *
     * @param relations 关联列表，调用方保证非空且已去重、无 null 元素
     * @return 插入行数
     */
    int insertBatch(@Param("relations") List<PortfolioTechStack> relations);
}
