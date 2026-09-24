package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.PortfolioDTO;
import com.god.thirdLine.domain.entity.Portfolio;
import com.god.thirdLine.domain.query.PortfolioQuery;
import com.god.thirdLine.domain.vo.PortfolioVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.PortfolioMapper;
import com.god.thirdLine.service.IPortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * <p>
 * 作品集表 服务实现类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-24
 */
@Service
@RequiredArgsConstructor
public class PortfolioServiceImpl extends ServiceImpl<PortfolioMapper, Portfolio> implements IPortfolioService {

    /** 已发布状态 */
    private static final int STATUS_PUBLISHED = 1;

    @Override
    public Long savePortfolio(PortfolioDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getTitle())) {
            throw new BusinessException(ResultCode.PORTFOLIO_TITLE_REQUIRED);
        }
        LocalDateTime now = LocalDateTime.now();
        int status = dto.getStatus() == null ? 0 : dto.getStatus();
        Portfolio portfolio = new Portfolio()
                .setTitle(dto.getTitle())
                .setSummary(dto.getSummary())
                .setCoverImage(dto.getCoverImage())
                .setTechStack(dto.getTechStack())
                .setRole(dto.getRole())
                .setPeriod(dto.getPeriod())
                .setDemoUrl(dto.getDemoUrl())
                .setRepoUrl(dto.getRepoUrl())
                .setStatus(status)
                .setCreateTime(now)
                .setUpdateTime(now);
        // 发布状态记录发布时间
        if (status == STATUS_PUBLISHED) {
            portfolio.setPublishTime(now);
        }
        this.save(portfolio);
        return portfolio.getId();
    }

    @Override
    public void updatePortfolio(PortfolioDTO dto) {
        if (dto == null || dto.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "作品ID不能为空");
        }
        Portfolio portfolio = this.getById(dto.getId());
        if (portfolio == null) {
            throw new BusinessException(ResultCode.PORTFOLIO_NOT_FOUND);
        }
        // 各字段按需覆盖
        if (StringUtils.hasText(dto.getTitle())) {
            portfolio.setTitle(dto.getTitle());
        }
        if (dto.getSummary() != null) {
            portfolio.setSummary(dto.getSummary());
        }
        if (dto.getCoverImage() != null) {
            portfolio.setCoverImage(dto.getCoverImage());
        }
        if (dto.getTechStack() != null) {
            portfolio.setTechStack(dto.getTechStack());
        }
        if (dto.getRole() != null) {
            portfolio.setRole(dto.getRole());
        }
        if (dto.getPeriod() != null) {
            portfolio.setPeriod(dto.getPeriod());
        }
        if (dto.getDemoUrl() != null) {
            portfolio.setDemoUrl(dto.getDemoUrl());
        }
        if (dto.getRepoUrl() != null) {
            portfolio.setRepoUrl(dto.getRepoUrl());
        }
        if (dto.getStatus() != null) {
            portfolio.setStatus(dto.getStatus());
            // 首次发布补充发布时间
            if (dto.getStatus() == STATUS_PUBLISHED && portfolio.getPublishTime() == null) {
                portfolio.setPublishTime(LocalDateTime.now());
            }
        }
        portfolio.setUpdateTime(LocalDateTime.now());
        this.updateById(portfolio);
    }

    @Override
    public void deletePortfolio(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "作品ID不能为空");
        }
        if (this.getById(id) == null) {
            throw new BusinessException(ResultCode.PORTFOLIO_NOT_FOUND);
        }
        this.removeById(id);
    }

    @Override
    public PortfolioVO getPortfolioDetail(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "作品ID不能为空");
        }
        Portfolio portfolio = this.getById(id);
        if (portfolio == null) {
            throw new BusinessException(ResultCode.PORTFOLIO_NOT_FOUND);
        }
        return toVO(portfolio);
    }

    @Override
    public PageResult<PortfolioVO> pagePortfolios(PortfolioQuery query) {
        if (query == null) {
            query = new PortfolioQuery();
        }
        String keyword = query.getKeyword();
        Page<Portfolio> page = new Page<>(query.getPage(), query.getSize());
        Page<Portfolio> result = this.page(page, Wrappers.<Portfolio>lambdaQuery()
                .eq(query.getStatus() != null, Portfolio::getStatus, query.getStatus())
                .and(StringUtils.hasText(keyword), w -> w
                        .like(Portfolio::getTitle, keyword)
                        .or()
                        .like(Portfolio::getSummary, keyword))
                .orderByDesc(Portfolio::getPublishTime)
                .orderByDesc(Portfolio::getId));
        List<PortfolioVO> records = result.getRecords().stream()
                .map(this::toVO)
                .collect(Collectors.toList());
        return new PageResult<>(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public List<PortfolioVO> listPublishedPortfolios() {
        List<Portfolio> portfolios = this.list(Wrappers.<Portfolio>lambdaQuery()
                .eq(Portfolio::getStatus, STATUS_PUBLISHED)
                .orderByDesc(Portfolio::getPublishTime)
                .orderByDesc(Portfolio::getId));
        return portfolios.stream().map(this::toVO).collect(Collectors.toList());
    }

    private PortfolioVO toVO(Portfolio portfolio) {
        PortfolioVO vo = new PortfolioVO();
        BeanUtils.copyProperties(portfolio, vo);
        return vo;
    }
}
