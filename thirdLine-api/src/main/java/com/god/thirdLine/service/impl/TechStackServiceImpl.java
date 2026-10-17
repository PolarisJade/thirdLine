package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.TechStackDTO;
import com.god.thirdLine.domain.entity.PortfolioTechStack;
import com.god.thirdLine.domain.entity.TechStack;
import com.god.thirdLine.domain.vo.TechStackVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.PortfolioTechStackMapper;
import com.god.thirdLine.mapper.TechStackMapper;
import com.god.thirdLine.service.ITechStackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * <p>
 * 技术栈字典表 服务实现类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-10-12
 */
@Service
@RequiredArgsConstructor
public class TechStackServiceImpl extends ServiceImpl<TechStackMapper, TechStack> implements ITechStackService {

    private final PortfolioTechStackMapper portfolioTechStackMapper;

    @Override
    public Long saveTechStack(TechStackDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getName())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "技术栈名称不能为空");
        }
        String name = dto.getName().trim();
        // 名称去重校验
        Long count = this.baseMapper.selectCount(Wrappers.<TechStack>lambdaQuery().eq(TechStack::getName, name));
        if (count != null && count > 0) {
            throw new BusinessException(ResultCode.TECH_STACK_NAME_DUPLICATE);
        }

        TechStack techStack = new TechStack()
                .setName(name)
                .setSort(dto.getSort() == null ? nextSort() : dto.getSort())
                .setStatus(dto.getStatus() == null ? TechStack.STATUS_ENABLED : dto.getStatus());
        // createTime / updateTime 由 MetaObjectHandler 自动填充
        this.save(techStack);
        return techStack.getId();
    }

    @Override
    public void updateTechStack(TechStackDTO dto) {
        if (dto == null || dto.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "技术栈ID不能为空");
        }
        TechStack techStack = this.getById(dto.getId());
        if (techStack == null) {
            throw new BusinessException(ResultCode.TECH_STACK_NOT_FOUND);
        }

        if (dto.getName() != null) {
            if (!StringUtils.hasText(dto.getName())) {
                throw new BusinessException(ResultCode.PARAM_ERROR, "技术栈名称不能为空");
            }
            String name = dto.getName().trim();
            // 名称去重校验（排除自身）
            Long count = this.baseMapper.selectCount(Wrappers.<TechStack>lambdaQuery()
                    .eq(TechStack::getName, name)
                    .ne(TechStack::getId, dto.getId()));
            if (count != null && count > 0) {
                throw new BusinessException(ResultCode.TECH_STACK_NAME_DUPLICATE);
            }
            techStack.setName(name);
        }
        if (dto.getSort() != null) {
            techStack.setSort(dto.getSort());
        }
        if (dto.getStatus() != null) {
            techStack.setStatus(dto.getStatus());
        }
        // updateTime 由 MetaObjectHandler 自动刷新
        this.updateById(techStack);
    }

    @Override
    public void deleteTechStack(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "技术栈ID不能为空");
        }
        TechStack techStack = this.getById(id);
        if (techStack == null) {
            throw new BusinessException(ResultCode.TECH_STACK_NOT_FOUND);
        }
        // 存在关联作品则不允许删除
        Long refCount = portfolioTechStackMapper.selectCount(Wrappers.<PortfolioTechStack>lambdaQuery()
                .eq(PortfolioTechStack::getTechStackId, id));
        if (refCount != null && refCount > 0) {
            throw new BusinessException(ResultCode.TECH_STACK_IN_USE);
        }
        this.removeById(id);
    }

    @Override
    public List<TechStackVO> listTechStacks() {
        return toVOList(this.list(Wrappers.<TechStack>lambdaQuery()
                .orderByAsc(TechStack::getSort)
                .orderByAsc(TechStack::getId)));
    }

    @Override
    public List<TechStackVO> listEnabledTechStacks() {
        return toVOList(this.list(Wrappers.<TechStack>lambdaQuery()
                .eq(TechStack::getStatus, TechStack.STATUS_ENABLED)
                .orderByAsc(TechStack::getSort)
                .orderByAsc(TechStack::getId)));
    }

    /**
     * 计算新增技术栈的排序权重：当前最大 sort + 1，无数据时从 1 开始
     */
    private int nextSort() {
        TechStack last = this.getOne(Wrappers.<TechStack>lambdaQuery()
                .orderByDesc(TechStack::getSort)
                .last("LIMIT 1"));
        if (last == null || last.getSort() == null) {
            return 1;
        }
        return last.getSort() + 1;
    }

    private List<TechStackVO> toVOList(List<TechStack> list) {
        return list.stream().map(item -> {
            TechStackVO vo = new TechStackVO();
            vo.setId(item.getId());
            vo.setName(item.getName());
            vo.setSort(item.getSort());
            vo.setStatus(item.getStatus());
            return vo;
        }).collect(Collectors.toList());
    }
}
