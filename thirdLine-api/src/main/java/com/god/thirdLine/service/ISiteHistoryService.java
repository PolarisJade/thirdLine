package com.god.thirdLine.service;

import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.domain.dto.SiteHistoryDTO;
import com.god.thirdLine.domain.query.SiteHistoryQuery;
import com.god.thirdLine.domain.vo.*;
import java.util.List;

public interface ISiteHistoryService {
    List<SiteHistoryVO> listPublished();
    PageResult<SiteHistoryAdminVO> page(SiteHistoryQuery query);
    SiteHistoryOptionsVO options();
    Long create(SiteHistoryDTO dto);
    void update(SiteHistoryDTO dto);
    void changePublishStatus(Long id, Integer publishStatus);
    void changeStatus(Long id, Integer status);
    void delete(Long id);
}

