package com.god.thirdLine.service;

import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.domain.dto.FootprintDTO;
import com.god.thirdLine.domain.query.FootprintQuery;
import com.god.thirdLine.domain.vo.FootprintAdminVO;
import com.god.thirdLine.domain.vo.FootprintCityOptionVO;
import com.god.thirdLine.domain.vo.FootprintVO;
import com.god.thirdLine.domain.vo.PhotoVO;

import java.util.List;

/**
 * 足迹城市服务。
 *
 * @author ParlisJade
 */
public interface IFootprintService {

    /** 前台：已发布且显示的城市，按到访日期升序 */
    List<FootprintVO> listPublished();

    /** 前台：某个城市下显示中的照片，按 sort 升序 */
    List<PhotoVO> listCityPhotos(String cityCode);

    /** 后台：分页查询 */
    PageResult<FootprintAdminVO> page(FootprintQuery query);

    /** 后台：城市下拉选项（照片归属城市选择用） */
    List<FootprintCityOptionVO> options();

    Long create(FootprintDTO dto);

    void update(FootprintDTO dto);

    void changePublishStatus(Long id, Integer publishStatus);

    void changeStatus(Long id, Integer status);

    void delete(Long id);
}
