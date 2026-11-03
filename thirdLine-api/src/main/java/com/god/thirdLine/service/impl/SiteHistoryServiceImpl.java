package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.SiteHistoryDTO;
import com.god.thirdLine.domain.entity.SiteHistory;
import com.god.thirdLine.domain.enums.*;
import com.god.thirdLine.domain.query.SiteHistoryQuery;
import com.god.thirdLine.domain.vo.*;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.SiteHistoryMapper;
import com.god.thirdLine.service.ISiteHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SiteHistoryServiceImpl implements ISiteHistoryService {
    private final SiteHistoryMapper mapper;

    @Override
    public List<SiteHistoryVO> listPublished() {
        return mapper.selectList(Wrappers.<SiteHistory>lambdaQuery()
                .eq(SiteHistory::getPublishStatus, HistoryPublishStatus.PUBLISHED.getCode())
                .eq(SiteHistory::getStatus, HistoryDisplayStatus.VISIBLE.getCode())
                .orderByAsc(SiteHistory::getUpdateDate, SiteHistory::getId))
                .stream().map(item -> new SiteHistoryVO(item.getId(), item.getDescription(),
                        item.getUpdateDate(), item.getVersion(), item.getUpdateType(),
                        HistoryUpdateType.fromCode(item.getUpdateType()).getLabel())).toList();
    }

    @Override
    public PageResult<SiteHistoryAdminVO> page(SiteHistoryQuery query) {
        if (query.getUpdateType() != null) HistoryUpdateType.fromCode(query.getUpdateType());
        if (query.getPublishStatus() != null) HistoryPublishStatus.fromCode(query.getPublishStatus());
        if (query.getStatus() != null) HistoryDisplayStatus.fromCode(query.getStatus());
        var wrapper = Wrappers.<SiteHistory>lambdaQuery()
                .eq(query.getUpdateType() != null, SiteHistory::getUpdateType, query.getUpdateType())
                .eq(query.getPublishStatus() != null, SiteHistory::getPublishStatus, query.getPublishStatus())
                .eq(query.getStatus() != null, SiteHistory::getStatus, query.getStatus());
        if (StringUtils.hasText(query.getKeyword())) {
            String keyword = query.getKeyword().trim();
            wrapper.and(w -> w.like(SiteHistory::getVersion, keyword).or().like(SiteHistory::getDescription, keyword));
        }
        wrapper.orderByDesc(SiteHistory::getUpdateDate, SiteHistory::getId);
        Page<SiteHistory> page = mapper.selectPage(new Page<>(query.getPage(), query.getSize()), wrapper);
        return new PageResult<>(page.getRecords().stream().map(this::adminVO).toList(),
                page.getTotal(), page.getCurrent(), page.getSize());
    }

    @Override
    public SiteHistoryOptionsVO options() {
        return new SiteHistoryOptionsVO(
                Arrays.stream(HistoryUpdateType.values()).map(e -> new SiteHistoryOptionsVO.Option(e.getCode(), e.getLabel())).toList(),
                Arrays.stream(HistoryPublishStatus.values()).map(e -> new SiteHistoryOptionsVO.Option(e.getCode(), e.getLabel())).toList(),
                Arrays.stream(HistoryDisplayStatus.values()).map(e -> new SiteHistoryOptionsVO.Option(e.getCode(), e.getLabel())).toList());
    }

    @Override
    public Long create(SiteHistoryDTO dto) {
        SiteHistory item = content(dto);
        item.setPublishStatus(dto.getPublishStatus() == null ? HistoryPublishStatus.DRAFT.getCode()
                : HistoryPublishStatus.fromCode(dto.getPublishStatus()).getCode());
        item.setStatus(dto.getStatus() == null ? HistoryDisplayStatus.VISIBLE.getCode()
                : HistoryDisplayStatus.fromCode(dto.getStatus()).getCode());
        mapper.insert(item);
        return item.getId();
    }

    @Override
    public void update(SiteHistoryDTO dto) {
        if (dto == null) throw new BusinessException(ResultCode.PARAM_ERROR, "历程内容不能为空");
        requireExisting(dto.getId());
        SiteHistory patch = content(dto).setId(dto.getId());
        // 未提交的状态保留原值，避免内容编辑覆盖独立的发布、显隐操作。
        if (dto.getPublishStatus() != null) patch.setPublishStatus(HistoryPublishStatus.fromCode(dto.getPublishStatus()).getCode());
        if (dto.getStatus() != null) patch.setStatus(HistoryDisplayStatus.fromCode(dto.getStatus()).getCode());
        mapper.updateById(patch);
    }

    @Override
    public void changePublishStatus(Long id, Integer publishStatus) {
        HistoryPublishStatus value = HistoryPublishStatus.fromCode(publishStatus);
        requireExisting(id);
        mapper.updateById(new SiteHistory().setId(id).setPublishStatus(value.getCode()));
    }

    @Override
    public void changeStatus(Long id, Integer status) {
        HistoryDisplayStatus value = HistoryDisplayStatus.fromCode(status);
        requireExisting(id);
        mapper.updateById(new SiteHistory().setId(id).setStatus(value.getCode()));
    }

    @Override
    public void delete(Long id) {
        requireExisting(id);
        mapper.deleteById(id);
    }

    private void requireExisting(Long id) {
        if (id == null || id <= 0) throw new BusinessException(ResultCode.PARAM_ERROR, "历程ID不合法");
        if (mapper.selectById(id) == null) throw new BusinessException(ResultCode.SITE_HISTORY_NOT_FOUND);
    }

    private SiteHistory content(SiteHistoryDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getDescription()))
            throw new BusinessException(ResultCode.PARAM_ERROR, "更新说明不能为空");
        String description = dto.getDescription().trim();
        // MySQL TEXT 最大 65535 字节；按 UTF-8 字节校验，避免多字节文本截断。
        if (description.getBytes(StandardCharsets.UTF_8).length > 65535)
            throw new BusinessException(ResultCode.PARAM_ERROR, "更新说明过长");
        if (!StringUtils.hasText(dto.getVersion()) || dto.getVersion().trim().codePointCount(0, dto.getVersion().trim().length()) > 32)
            throw new BusinessException(ResultCode.PARAM_ERROR, "版本号不能为空且不能超过32个字符");
        if (dto.getUpdateDate() == null || dto.getUpdateDate().getYear() < 1000 || dto.getUpdateDate().getYear() > 9999)
            throw new BusinessException(ResultCode.PARAM_ERROR, "请填写有效更新日期");
        return new SiteHistory().setDescription(description).setVersion(dto.getVersion().trim())
                .setUpdateDate(dto.getUpdateDate()).setUpdateType(HistoryUpdateType.fromCode(dto.getUpdateType()).getCode());
    }

    private SiteHistoryAdminVO adminVO(SiteHistory item) {
        return new SiteHistoryAdminVO(item.getId(), item.getDescription(), item.getUpdateDate(),
                item.getVersion(), item.getUpdateType(), HistoryUpdateType.fromCode(item.getUpdateType()).getLabel(),
                item.getPublishStatus(), HistoryPublishStatus.fromCode(item.getPublishStatus()).getLabel(),
                item.getStatus(), HistoryDisplayStatus.fromCode(item.getStatus()).getLabel(),
                item.getCreateTime(), item.getUpdateTime());
    }
}

