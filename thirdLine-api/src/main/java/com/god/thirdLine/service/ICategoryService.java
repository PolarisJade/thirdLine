package com.god.thirdLine.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.god.thirdLine.domain.dto.CategoryDTO;
import com.god.thirdLine.domain.entity.Category;
import com.god.thirdLine.domain.vo.CategoryVO;

import java.util.List;

/**
 * <p>
 * 分类表 服务类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
public interface ICategoryService extends IService<Category> {

    /**
     * 新增分类，分类名称不允许重复
     *
     * @param dto 分类数据
     * @return 新增分类ID
     */
    Long saveCategory(CategoryDTO dto);

    /**
     * 删除分类，若存在关联文章则不允许删除
     *
     * @param id 分类ID
     */
    void deleteCategory(Long id);

    /**
     * 修改分类名称与排序
     *
     * @param dto 分类数据
     */
    void updateCategory(CategoryDTO dto);

    /**
     * 查询所有分类（按排序权重升序）
     *
     * @return 分类列表
     */
    List<CategoryVO> listCategories();
}
