package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.CategoryDTO;
import com.god.thirdLine.domain.entity.Article;
import com.god.thirdLine.domain.entity.Category;
import com.god.thirdLine.domain.vo.CategoryVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.ArticleMapper;
import com.god.thirdLine.mapper.CategoryMapper;
import com.god.thirdLine.service.ICategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * <p>
 * 分类表 服务实现类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl extends ServiceImpl<CategoryMapper, Category> implements ICategoryService {

    private final ArticleMapper articleMapper;

    @Override
    public Long saveCategory(CategoryDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getName())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "分类名称不能为空");
        }
        // 分类名称不允许重复
        Long count = this.baseMapper.selectCount(Wrappers.<Category>lambdaQuery()
                .eq(Category::getName, dto.getName()));
        if (count != null && count > 0) {
            throw new BusinessException(ResultCode.CATEGORY_NAME_DUPLICATE);
        }

        LocalDateTime now = LocalDateTime.now();
        Category category = new Category()
                .setName(dto.getName())
                .setSort(dto.getSort() == null ? 0 : dto.getSort())
                .setCreateTime(now)
                .setUpdateTime(now);
        this.save(category);
        return category.getId();
    }

    @Override
    public void deleteCategory(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "分类ID不能为空");
        }
        Category category = this.getById(id);
        if (category == null) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }
        // 存在关联文章则不允许删除
        Long refCount = articleMapper.selectCount(Wrappers.<Article>lambdaQuery()
                .eq(Article::getCategoryId, id));
        if (refCount != null && refCount > 0) {
            throw new BusinessException(ResultCode.CATEGORY_IN_USE);
        }
        this.removeById(id);
    }

    @Override
    public void updateCategory(CategoryDTO dto) {
        if (dto == null || dto.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "分类ID不能为空");
        }
        Category category = this.getById(dto.getId());
        if (category == null) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }
        // 修改名称时校验重复（排除自身）
        if (StringUtils.hasText(dto.getName()) && !dto.getName().equals(category.getName())) {
            Long count = this.baseMapper.selectCount(Wrappers.<Category>lambdaQuery()
                    .eq(Category::getName, dto.getName())
                    .ne(Category::getId, dto.getId()));
            if (count != null && count > 0) {
                throw new BusinessException(ResultCode.CATEGORY_NAME_DUPLICATE);
            }
            category.setName(dto.getName());
        }
        if (dto.getSort() != null) {
            category.setSort(dto.getSort());
        }
        category.setUpdateTime(LocalDateTime.now());
        this.updateById(category);
    }

    @Override
    public List<CategoryVO> listCategories() {
        List<Category> categories = this.list(Wrappers.<Category>lambdaQuery()
                .orderByAsc(Category::getSort)
                .orderByDesc(Category::getId));
        return categories.stream().map(category -> {
            CategoryVO vo = new CategoryVO();
            vo.setId(category.getId());
            vo.setName(category.getName());
            vo.setSort(category.getSort());
            return vo;
        }).collect(Collectors.toList());
    }
}
