package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.PortfolioDTO;
import com.god.thirdLine.domain.entity.Portfolio;
import com.god.thirdLine.domain.entity.PortfolioTechStack;
import com.god.thirdLine.domain.query.PortfolioQuery;
import com.god.thirdLine.domain.vo.PortfolioTechStackVO;
import com.god.thirdLine.domain.vo.PortfolioVO;
import com.god.thirdLine.domain.vo.TechStackVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.PortfolioMapper;
import com.god.thirdLine.mapper.PortfolioTechStackMapper;
import com.god.thirdLine.mapper.TechStackMapper;
import com.god.thirdLine.service.IOssReferenceService;
import com.god.thirdLine.service.IPortfolioService;
import com.god.thirdLine.util.ObjectStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
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

    private final ObjectStorageUtil objectStorageUtil;
    private final IOssReferenceService ossReferenceService;
    private final PortfolioTechStackMapper portfolioTechStackMapper;
    private final TechStackMapper techStackMapper;

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
                .setRole(dto.getRole())
                .setPeriod(dto.getPeriod())
                .setDemoUrl(dto.getDemoUrl())
                .setRepoUrl(dto.getRepoUrl())
                .setStatus(status);
        // createTime / updateTime 由 MetaObjectHandler 自动填充
        // 发布状态记录发布时间
        if (status == STATUS_PUBLISHED) {
            portfolio.setPublishTime(now);
        }
        this.save(portfolio);
        // 保存作品与技术栈的关联（来自 tl_tech_stack 字典）
        saveTechStackRelations(portfolio.getId(), dto.getTechStackIds());
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
        // 记录旧封面：更新成功后清理被替换掉的 OSS 文件
        String oldCoverImage = portfolio.getCoverImage();
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
        // updateTime 由 MetaObjectHandler 自动刷新
        this.updateById(portfolio);

        // techStackIds 非 null 时整体覆盖技术栈关联（传空数组即清空）
        if (dto.getTechStackIds() != null) {
            portfolioTechStackMapper.delete(Wrappers.<PortfolioTechStack>lambdaQuery()
                    .eq(PortfolioTechStack::getPortfolioId, portfolio.getId()));
            saveTechStackRelations(portfolio.getId(), dto.getTechStackIds());
        }

        // 换封面后清理旧文件：确认无人引用才删，手填外链自动跳过
        if (dto.getCoverImage() != null) {
            ossReferenceService.deleteIfUnused(oldCoverImage, dto.getCoverImage());
        }
    }

    @Override
    public void deletePortfolio(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "作品ID不能为空");
        }
        Portfolio portfolio = this.getById(id);
        if (portfolio == null) {
            throw new BusinessException(ResultCode.PORTFOLIO_NOT_FOUND);
        }
        this.removeById(id);
        // 级联删除技术栈关联
        portfolioTechStackMapper.delete(Wrappers.<PortfolioTechStack>lambdaQuery()
                .eq(PortfolioTechStack::getPortfolioId, id));
        // 同步清理 OSS 上的封面图（手填外链自动跳过）
        objectStorageUtil.deleteByUrl(portfolio.getCoverImage());
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
        PortfolioVO vo = toVO(portfolio);
        // 详情只有一条，同样走批量装配；后台编辑要拿到完整关系（含被禁用的技术栈）
        fillTechStacks(List.of(vo), false);
        return vo;
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
        fillTechStacks(records, false);
        return new PageResult<>(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public List<PortfolioVO> listPublishedPortfolios() {
        List<Portfolio> portfolios = this.list(Wrappers.<Portfolio>lambdaQuery()
                .eq(Portfolio::getStatus, STATUS_PUBLISHED)
                .orderByDesc(Portfolio::getPublishTime)
                .orderByDesc(Portfolio::getId));
        List<PortfolioVO> records = portfolios.stream().map(this::toVO).collect(Collectors.toList());
        // 前台只展示启用中的技术栈
        fillTechStacks(records, true);
        return records;
    }

    private PortfolioVO toVO(Portfolio portfolio) {
        PortfolioVO vo = new PortfolioVO();
        BeanUtils.copyProperties(portfolio, vo);
        return vo;
    }

    /**
     * 保存作品与技术栈的关联（自动去重、忽略空集合、跳过空ID）。
     * 整批拼成一条 INSERT，避免在循环里逐条写库。
     */
    private void saveTechStackRelations(Long portfolioId, List<Long> techStackIds) {
        if (CollectionUtils.isEmpty(techStackIds)) {
            return;
        }
        LinkedHashSet<Long> distinctIds = new LinkedHashSet<>(techStackIds);
        distinctIds.remove(null);
        if (distinctIds.isEmpty()) {
            return;
        }
        List<PortfolioTechStack> relations = distinctIds.stream()
                .map(techStackId -> new PortfolioTechStack()
                        .setPortfolioId(portfolioId)
                        .setTechStackId(techStackId))
                .collect(Collectors.toList());
        portfolioTechStackMapper.insertBatch(relations);
    }

    /**
     * 批量装配作品的技术栈：一次查询取回全部关联，避免逐条查询（N+1）
     *
     * @param onlyEnabled 是否只装配启用中的技术栈（前台 true / 后台 false）
     */
    private void fillTechStacks(List<PortfolioVO> records, boolean onlyEnabled) {
        if (CollectionUtils.isEmpty(records)) {
            return;
        }
        List<Long> portfolioIds = records.stream().map(PortfolioVO::getId).collect(Collectors.toList());
        List<PortfolioTechStackVO> relations = techStackMapper.selectPortfolioTechStacks(portfolioIds, onlyEnabled);
        Map<Long, List<TechStackVO>> techMap = relations.stream().collect(Collectors.groupingBy(
                PortfolioTechStackVO::getPortfolioId,
                Collectors.mapping(relation -> {
                    TechStackVO tech = new TechStackVO();
                    tech.setId(relation.getTechStackId());
                    tech.setName(relation.getTechStackName());
                    tech.setSort(relation.getSort());
                    return tech;
                }, Collectors.toList())
        ));
        records.forEach(vo -> vo.setTechStacks(techMap.getOrDefault(vo.getId(), new ArrayList<>())));
    }
}
