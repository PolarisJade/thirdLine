package com.god.thirdLine.domain.vo;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 后台足迹管理对象，比前台多出发布 / 显隐状态和审计字段。
 *
 * @author ParlisJade
 */
public record FootprintAdminVO(Long id, String cityCode, String cityName,
                               String provinceCode, String provinceName,
                               LocalDate visitDate, String content,
                               Integer publishStatus, Integer status,
                               Long photoCount, LocalDateTime createTime,
                               LocalDateTime updateTime) {
}
