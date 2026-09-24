package com.god.thirdLine.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.domain.dto.PortfolioDTO;
import com.god.thirdLine.domain.entity.Portfolio;
import com.god.thirdLine.domain.query.PortfolioQuery;
import com.god.thirdLine.domain.vo.PortfolioVO;

import java.util.List;

/**
 * <p>
 * 作品集表 服务类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-24
 */
public interface IPortfolioService extends IService<Portfolio> {

    /**
     * 新增作品，状态为已发布时记录发布时间
     *
     * @param dto 作品数据
     * @return 新增作品ID
     */
    Long savePortfolio(PortfolioDTO dto);

    /**
     * 修改作品（标题、摘要、封面、技术栈、链接、状态等）
     *
     * @param dto 作品数据，id 必填
     */
    void updatePortfolio(PortfolioDTO dto);

    /**
     * 根据ID删除作品
     *
     * @param id 作品ID
     */
    void deletePortfolio(Long id);

    /**
     * 根据ID查询作品详情
     *
     * @param id 作品ID
     * @return 作品详情
     */
    PortfolioVO getPortfolioDetail(Long id);

    /**
     * 标准分页查询作品（后台管理，可按状态/关键词过滤）
     *
     * @param query 查询条件
     * @return 分页结果
     */
    PageResult<PortfolioVO> pagePortfolios(PortfolioQuery query);

    /**
     * 查询全部已发布作品，按发布时间倒序（前台作品集展示使用）
     *
     * @return 作品列表
     */
    List<PortfolioVO> listPublishedPortfolios();
}
