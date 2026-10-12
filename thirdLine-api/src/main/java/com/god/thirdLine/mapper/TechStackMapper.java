package com.god.thirdLine.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.god.thirdLine.domain.entity.TechStack;
import com.god.thirdLine.domain.vo.PortfolioTechStackVO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * <p>
 * 技术栈字典表 Mapper 接口
 * </p>
 *
 * @author ParlisJade
 * @since 2026-10-12
 */
public interface TechStackMapper extends BaseMapper<TechStack> {

    /**
     * 批量查询若干作品关联的技术栈（用于作品列表/详情批量装配，避免逐条查询）
     *
     * @param portfolioIds 作品ID集合
     * @param onlyEnabled  是否只返回启用中的技术栈：
     *                     前台展示传 true（禁用的不露面），
     *                     后台管理必须传 false（否则编辑保存会丢掉被禁用的关联）
     */
    List<PortfolioTechStackVO> selectPortfolioTechStacks(@Param("portfolioIds") List<Long> portfolioIds,
                                                         @Param("onlyEnabled") boolean onlyEnabled);
}
