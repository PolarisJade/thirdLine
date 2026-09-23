package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.PhotoDTO;
import com.god.thirdLine.domain.entity.Photo;
import com.god.thirdLine.domain.query.PhotoQuery;
import com.god.thirdLine.domain.vo.PhotoVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.PhotoMapper;
import com.god.thirdLine.service.IPhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * <p>
 * 照片表 服务实现类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-21
 */
@Service
@RequiredArgsConstructor
public class PhotoServiceImpl extends ServiceImpl<PhotoMapper, Photo> implements IPhotoService {

    @Override
    public Long savePhoto(PhotoDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getUrl())) {
            throw new BusinessException(ResultCode.PHOTO_URL_REQUIRED);
        }
        LocalDateTime now = LocalDateTime.now();
        Photo photo = new Photo()
                .setTitle(dto.getTitle())
                .setDescription(dto.getDescription())
                .setUrl(dto.getUrl())
                .setWidth(dto.getWidth())
                .setHeight(dto.getHeight())
                .setFileSize(dto.getFileSize())
                .setStatus(dto.getStatus() == null ? 1 : dto.getStatus())
                .setCreateTime(now)
                .setUpdateTime(now);
        // sort 未指定时自增追加到末尾（当前最大 sort + 1）
        photo.setSort(dto.getSort() == null ? nextSort() : dto.getSort());
        this.save(photo);
        return photo.getId();
    }

    @Override
    public void updatePhoto(PhotoDTO dto) {
        if (dto == null || dto.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "照片ID不能为空");
        }
        Photo photo = this.getById(dto.getId());
        if (photo == null) {
            throw new BusinessException(ResultCode.PHOTO_NOT_FOUND);
        }
        // 图片、标题、描述、宽高、文件大小按需覆盖
        if (StringUtils.hasText(dto.getUrl())) {
            photo.setUrl(dto.getUrl());
        }
        if (dto.getTitle() != null) {
            photo.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            photo.setDescription(dto.getDescription());
        }
        if (dto.getWidth() != null) {
            photo.setWidth(dto.getWidth());
        }
        if (dto.getHeight() != null) {
            photo.setHeight(dto.getHeight());
        }
        if (dto.getFileSize() != null) {
            photo.setFileSize(dto.getFileSize());
        }
        if (dto.getSort() != null) {
            photo.setSort(dto.getSort());
        }
        if (dto.getStatus() != null) {
            photo.setStatus(dto.getStatus());
        }
        photo.setUpdateTime(LocalDateTime.now());
        this.updateById(photo);
    }

    @Override
    public void deletePhoto(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "照片ID不能为空");
        }
        if (this.getById(id) == null) {
            throw new BusinessException(ResultCode.PHOTO_NOT_FOUND);
        }
        this.removeById(id);
    }

    @Override
    public PhotoVO getPhotoDetail(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "照片ID不能为空");
        }
        Photo photo = this.getById(id);
        if (photo == null) {
            throw new BusinessException(ResultCode.PHOTO_NOT_FOUND);
        }
        return toVO(photo);
    }

    @Override
    public PageResult<PhotoVO> pagePhotos(PhotoQuery query) {
        if (query == null) {
            query = new PhotoQuery();
        }
        Page<Photo> page = new Page<>(query.getPage(), query.getSize());
        Page<Photo> result = this.page(page, Wrappers.<Photo>lambdaQuery()
                .eq(query.getStatus() != null, Photo::getStatus, query.getStatus())
                .orderByAsc(Photo::getSort)
                .orderByDesc(Photo::getId));
        List<PhotoVO> records = result.getRecords().stream()
                .map(this::toVO)
                .collect(Collectors.toList());
        return new PageResult<>(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public List<PhotoVO> listVisiblePhotos() {
        List<Photo> photos = this.list(Wrappers.<Photo>lambdaQuery()
                .eq(Photo::getStatus, 1)
                .orderByAsc(Photo::getSort)
                .orderByAsc(Photo::getId));
        return photos.stream().map(this::toVO).collect(Collectors.toList());
    }

    /**
     * 计算新增照片的排序权重：当前最大 sort + 1，无数据时从 1 开始
     */
    private int nextSort() {
        Photo last = this.getOne(Wrappers.<Photo>lambdaQuery()
                .orderByDesc(Photo::getSort)
                .last("LIMIT 1"));
        if (last == null || last.getSort() == null) {
            return 1;
        }
        return last.getSort() + 1;
    }

    private PhotoVO toVO(Photo photo) {
        PhotoVO vo = new PhotoVO();
        BeanUtils.copyProperties(photo, vo);
        return vo;
    }
}
