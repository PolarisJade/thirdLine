package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.TagDTO;
import com.god.thirdLine.domain.entity.ArticleTag;
import com.god.thirdLine.domain.entity.Tag;
import com.god.thirdLine.domain.vo.TagVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.ArticleTagMapper;
import com.god.thirdLine.mapper.TagMapper;
import com.god.thirdLine.service.ITagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * <p>
 * 标签表 服务实现类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
@Service
@RequiredArgsConstructor
public class TagServiceImpl extends ServiceImpl<TagMapper, Tag> implements ITagService {

    private final ArticleTagMapper articleTagMapper;

    @Override
    public Long saveTag(TagDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getName())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "标签名称不能为空");
        }
        // 名称去重校验
        Long count = this.baseMapper.selectCount(Wrappers.<Tag>lambdaQuery().eq(Tag::getName, dto.getName()));
        if (count != null && count > 0) {
            throw new BusinessException(ResultCode.TAG_NAME_DUPLICATE);
        }

        LocalDateTime now = LocalDateTime.now();
        Tag tag = new Tag()
                .setName(dto.getName())
                .setCreateTime(now)
                .setUpdateTime(now);
        this.save(tag);
        return tag.getId();
    }

    @Override
    public void deleteTag(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "标签ID不能为空");
        }
        Tag tag = this.getById(id);
        if (tag == null) {
            throw new BusinessException(ResultCode.TAG_NOT_FOUND);
        }
        // 存在关联文章则不允许删除
        Long refCount = articleTagMapper.selectCount(Wrappers.<ArticleTag>lambdaQuery()
                .eq(ArticleTag::getTagId, id));
        if (refCount != null && refCount > 0) {
            throw new BusinessException(ResultCode.TAG_IN_USE);
        }
        this.removeById(id);
    }

    @Override
    public void updateTag(TagDTO dto) {
        if (dto == null || dto.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "标签ID不能为空");
        }
        if (!StringUtils.hasText(dto.getName())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "标签名称不能为空");
        }
        Tag tag = this.getById(dto.getId());
        if (tag == null) {
            throw new BusinessException(ResultCode.TAG_NOT_FOUND);
        }
        // 名称去重校验（排除自身）
        Long count = this.baseMapper.selectCount(Wrappers.<Tag>lambdaQuery()
                .eq(Tag::getName, dto.getName())
                .ne(Tag::getId, dto.getId()));
        if (count != null && count > 0) {
            throw new BusinessException(ResultCode.TAG_NAME_DUPLICATE);
        }
        tag.setName(dto.getName());
        tag.setUpdateTime(LocalDateTime.now());
        this.updateById(tag);
    }

    @Override
    public List<TagVO> listTags() {
        List<Tag> tags = this.list(Wrappers.<Tag>lambdaQuery().orderByDesc(Tag::getId));
        return tags.stream().map(tag -> {
            TagVO vo = new TagVO();
            vo.setId(tag.getId());
            vo.setName(tag.getName());
            return vo;
        }).collect(Collectors.toList());
    }
}
