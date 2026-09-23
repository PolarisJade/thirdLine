package com.god.thirdLine.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.domain.dto.PhotoDTO;
import com.god.thirdLine.domain.entity.Photo;
import com.god.thirdLine.domain.query.PhotoQuery;
import com.god.thirdLine.domain.vo.PhotoVO;

import java.util.List;

/**
 * <p>
 * 照片表 服务类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-21
 */
public interface IPhotoService extends IService<Photo> {

    /**
     * 新增照片，sort 未指定时自动追加到末尾（当前最大 sort + 1）
     *
     * @param dto 照片数据
     * @return 新增照片ID
     */
    Long savePhoto(PhotoDTO dto);

    /**
     * 修改照片（可修改图片、标题、描述、排序、显隐等）
     *
     * @param dto 照片数据，id 必填
     */
    void updatePhoto(PhotoDTO dto);

    /**
     * 根据ID删除照片
     *
     * @param id 照片ID
     */
    void deletePhoto(Long id);

    /**
     * 根据ID查询照片详情
     *
     * @param id 照片ID
     * @return 照片详情
     */
    PhotoVO getPhotoDetail(Long id);

    /**
     * 标准分页查询照片（后台管理，可按状态过滤）
     *
     * @param query 查询条件
     * @return 分页结果
     */
    PageResult<PhotoVO> pagePhotos(PhotoQuery query);

    /**
     * 查询全部显示状态的照片，按排序权重升序（前台相册翻页使用）
     *
     * @return 照片列表
     */
    List<PhotoVO> listVisiblePhotos();
}
