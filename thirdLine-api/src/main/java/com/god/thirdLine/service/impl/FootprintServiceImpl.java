package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.FootprintDTO;
import com.god.thirdLine.domain.entity.Footprint;
import com.god.thirdLine.domain.entity.Photo;
import com.god.thirdLine.domain.query.FootprintQuery;
import com.god.thirdLine.domain.vo.FootprintAdminVO;
import com.god.thirdLine.domain.vo.FootprintCityOptionVO;
import com.god.thirdLine.domain.vo.FootprintVO;
import com.god.thirdLine.domain.vo.PhotoVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.FootprintMapper;
import com.god.thirdLine.mapper.PhotoMapper;
import com.god.thirdLine.service.IFootprintService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 足迹城市服务实现。
 *
 * <p>照片复用已有的 tl_photo 表，通过 city_code 关联；这里只做只读聚合，
 * 照片本身的增删改仍由相册模块负责。</p>
 *
 * @author ParlisJade
 */
@Service
@RequiredArgsConstructor
public class FootprintServiceImpl implements IFootprintService {

    /** 市级 / 省级行政区划代码：6 位数字 */
    private static final Pattern ADCODE = Pattern.compile("\\d{6}");

    private static final int PUBLISHED = 1;
    private static final int VISIBLE = 1;
    private static final int MAX_NAME_LENGTH = 64;
    private static final int TEXT_MAX_BYTES = 65535;

    private final FootprintMapper footprintMapper;
    private final PhotoMapper photoMapper;

    @Override
    public List<FootprintVO> listPublished() {
        List<Footprint> cities = footprintMapper.selectList(Wrappers.<Footprint>lambdaQuery()
                .eq(Footprint::getPublishStatus, PUBLISHED)
                .eq(Footprint::getStatus, VISIBLE)
                .orderByAsc(Footprint::getVisitDate)
                .orderByAsc(Footprint::getId));
        if (cities.isEmpty()) {
            return List.of();
        }
        Map<String, List<Photo>> photos = photosByCity(cities.stream().map(Footprint::getCityCode).toList());
        return cities.stream().map(city -> toVO(city, photos.get(city.getCityCode()))).toList();
    }

    @Override
    public List<PhotoVO> listCityPhotos(String cityCode) {
        if (!StringUtils.hasText(cityCode)) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "城市代码不能为空");
        }
        String code = cityCode.trim();
        // 前台只允许查看已发布且显示的城市，避免草稿城市的照片被提前看到
        Footprint city = footprintMapper.selectOne(Wrappers.<Footprint>lambdaQuery()
                .eq(Footprint::getCityCode, code)
                .eq(Footprint::getPublishStatus, PUBLISHED)
                .eq(Footprint::getStatus, VISIBLE)
                .last("LIMIT 1"));
        if (city == null) {
            throw new BusinessException(ResultCode.FOOTPRINT_NOT_FOUND);
        }
        return photosOfCity(code).stream().map(this::toPhotoVO).toList();
    }

    @Override
    public PageResult<FootprintAdminVO> page(FootprintQuery query) {
        if (query == null) {
            query = new FootprintQuery();
        }
        var wrapper = Wrappers.<Footprint>lambdaQuery()
                .eq(query.getPublishStatus() != null, Footprint::getPublishStatus, query.getPublishStatus())
                .eq(query.getStatus() != null, Footprint::getStatus, query.getStatus());
        if (StringUtils.hasText(query.getKeyword())) {
            String keyword = query.getKeyword().trim();
            wrapper.and(w -> w.like(Footprint::getCityName, keyword)
                    .or().like(Footprint::getProvinceName, keyword));
        }
        wrapper.orderByDesc(Footprint::getVisitDate).orderByDesc(Footprint::getId);

        Page<Footprint> page = footprintMapper.selectPage(new Page<>(query.getPage(), query.getSize()), wrapper);
        Map<String, List<Photo>> photos = photosByCity(page.getRecords().stream()
                .map(Footprint::getCityCode).toList());
        List<FootprintAdminVO> records = page.getRecords().stream()
                .map(city -> toAdminVO(city, photos.get(city.getCityCode())))
                .toList();
        return new PageResult<>(records, page.getTotal(), page.getCurrent(), page.getSize());
    }

    @Override
    public List<FootprintCityOptionVO> options() {
        return footprintMapper.selectList(Wrappers.<Footprint>lambdaQuery()
                        .orderByAsc(Footprint::getProvinceName)
                        .orderByAsc(Footprint::getCityName))
                .stream()
                .map(city -> new FootprintCityOptionVO(city.getId(), city.getCityCode(),
                        city.getCityName(), city.getProvinceName()))
                .toList();
    }

    @Override
    public Long create(FootprintDTO dto) {
        Footprint item = validated(dto);
        if (existsCityCode(item.getCityCode(), null)) {
            throw new BusinessException(ResultCode.FOOTPRINT_CITY_DUPLICATE);
        }
        item.setPublishStatus(dto.getPublishStatus() == null ? 0 : flag(dto.getPublishStatus()));
        item.setStatus(dto.getStatus() == null ? VISIBLE : flag(dto.getStatus()));
        footprintMapper.insert(item);
        return item.getId();
    }

    @Override
    public void update(FootprintDTO dto) {
        if (dto == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "足迹内容不能为空");
        }
        requireExisting(dto.getId());
        Footprint patch = validated(dto).setId(dto.getId());
        if (existsCityCode(patch.getCityCode(), dto.getId())) {
            throw new BusinessException(ResultCode.FOOTPRINT_CITY_DUPLICATE);
        }
        // 未提交的状态保留原值，避免内容编辑覆盖独立的发布、显隐操作
        if (dto.getPublishStatus() != null) {
            patch.setPublishStatus(flag(dto.getPublishStatus()));
        }
        if (dto.getStatus() != null) {
            patch.setStatus(flag(dto.getStatus()));
        }
        footprintMapper.updateById(patch);
        // updateById 会跳过 null 字段，到访日期需要单独置空（编辑时清空日期是明确操作）
        if (dto.getVisitDate() == null) {
            footprintMapper.update(null, Wrappers.<Footprint>lambdaUpdate()
                    .eq(Footprint::getId, dto.getId())
                    .set(Footprint::getVisitDate, null));
        }
    }

    @Override
    public void changePublishStatus(Long id, Integer publishStatus) {
        int value = flag(publishStatus);
        requireExisting(id);
        footprintMapper.updateById(new Footprint().setId(id).setPublishStatus(value));
    }

    @Override
    public void changeStatus(Long id, Integer status) {
        int value = flag(status);
        requireExisting(id);
        footprintMapper.updateById(new Footprint().setId(id).setStatus(value));
    }

    @Override
    public void delete(Long id) {
        requireExisting(id);
        footprintMapper.deleteById(id);
    }

    /* ------------------------------------------------------------- 内部方法 */

    private boolean existsCityCode(String cityCode, Long excludeId) {
        return footprintMapper.selectCount(Wrappers.<Footprint>lambdaQuery()
                .eq(Footprint::getCityCode, cityCode)
                .ne(excludeId != null, Footprint::getId, excludeId)) > 0;
    }

    private void requireExisting(Long id) {
        if (id == null || id <= 0) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "足迹ID不合法");
        }
        if (footprintMapper.selectById(id) == null) {
            throw new BusinessException(ResultCode.FOOTPRINT_NOT_FOUND);
        }
    }

    private Footprint validated(FootprintDTO dto) {
        if (dto == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "足迹内容不能为空");
        }
        String cityCode = adcode(dto.getCityCode(), "城市行政区划代码");
        String cityName = name(dto.getCityName(), "城市名称");
        String provinceCode = adcode(dto.getProvinceCode(), "省份行政区划代码");
        String provinceName = name(dto.getProvinceName(), "省份名称");

        String content = dto.getContent() == null ? null : dto.getContent().trim();
        if (content != null && content.getBytes(StandardCharsets.UTF_8).length > TEXT_MAX_BYTES) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "城市评价过长");
        }
        if (dto.getVisitDate() != null) {
            int year = dto.getVisitDate().getYear();
            if (year < 1000 || year > 9999) {
                throw new BusinessException(ResultCode.PARAM_ERROR, "请填写有效到访日期");
            }
        }
        return new Footprint()
                .setCityCode(cityCode)
                .setCityName(cityName)
                .setProvinceCode(provinceCode)
                .setProvinceName(provinceName)
                .setVisitDate(dto.getVisitDate())
                .setContent(content);
    }

    private String adcode(String value, String label) {
        String code = value == null ? "" : value.trim();
        if (!ADCODE.matcher(code).matches()) {
            throw new BusinessException(ResultCode.PARAM_ERROR, label + "必须是 6 位数字");
        }
        return code;
    }

    private String name(String value, String label) {
        String text = value == null ? "" : value.trim();
        if (!StringUtils.hasText(text)) {
            throw new BusinessException(ResultCode.PARAM_ERROR, label + "不能为空");
        }
        if (text.codePointCount(0, text.length()) > MAX_NAME_LENGTH) {
            throw new BusinessException(ResultCode.PARAM_ERROR, label + "不能超过 " + MAX_NAME_LENGTH + " 个字符");
        }
        return text;
    }

    private int flag(Integer value) {
        if (value == null || (value != 0 && value != 1)) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "状态只能为 0 或 1");
        }
        return value;
    }

    /** 已发布且显示的照片，按城市分组；组内按 sort、id 升序 */
    private Map<String, List<Photo>> photosByCity(Collection<String> cityCodes) {
        if (cityCodes == null || cityCodes.isEmpty()) {
            return Map.of();
        }
        return photoMapper.selectList(Wrappers.<Photo>lambdaQuery()
                        .in(Photo::getCityCode, cityCodes)
                        .eq(Photo::getStatus, VISIBLE)
                        .orderByAsc(Photo::getSort)
                        .orderByAsc(Photo::getId))
                .stream()
                .collect(Collectors.groupingBy(Photo::getCityCode, LinkedHashMap::new, Collectors.toList()));
    }

    private List<Photo> photosOfCity(String cityCode) {
        return photoMapper.selectList(Wrappers.<Photo>lambdaQuery()
                .eq(Photo::getCityCode, cityCode)
                .eq(Photo::getStatus, VISIBLE)
                .orderByAsc(Photo::getSort)
                .orderByAsc(Photo::getId));
    }

    private FootprintVO toVO(Footprint city, List<Photo> photos) {
        List<Photo> list = photos == null ? List.of() : photos;
        return new FootprintVO(city.getId(), city.getCityCode(), city.getCityName(),
                city.getProvinceCode(), city.getProvinceName(), city.getVisitDate(),
                city.getContent(), (long) list.size(),
                list.isEmpty() ? null : list.get(0).getUrl());
    }

    private FootprintAdminVO toAdminVO(Footprint city, List<Photo> photos) {
        long count = photos == null ? 0 : photos.size();
        return new FootprintAdminVO(city.getId(), city.getCityCode(), city.getCityName(),
                city.getProvinceCode(), city.getProvinceName(), city.getVisitDate(),
                city.getContent(), city.getPublishStatus(), city.getStatus(),
                count, city.getCreateTime(), city.getUpdateTime());
    }

    private PhotoVO toPhotoVO(Photo photo) {
        PhotoVO vo = new PhotoVO();
        BeanUtils.copyProperties(photo, vo);
        return vo;
    }
}
