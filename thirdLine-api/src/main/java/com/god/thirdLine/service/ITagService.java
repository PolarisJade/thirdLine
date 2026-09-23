package com.god.thirdLine.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.god.thirdLine.domain.dto.TagDTO;
import com.god.thirdLine.domain.entity.Tag;
import com.god.thirdLine.domain.vo.TagVO;

import java.util.List;

/**
 * <p>
 * 标签表 服务类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
public interface ITagService extends IService<Tag> {

    /**
     * 新增标签
     *
     * @param dto 标签数据
     * @return 新增标签ID
     */
    Long saveTag(TagDTO dto);

    /**
     * 删除标签，若已关联文章则不允许删除
     *
     * @param id 标签ID
     */
    void deleteTag(Long id);

    /**
     * 修改标签名称
     *
     * @param dto 标签数据
     */
    void updateTag(TagDTO dto);

    /**
     * 查询所有标签
     *
     * @return 标签列表
     */
    List<TagVO> listTags();
}
