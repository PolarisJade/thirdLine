package com.god.thirdLine.domain.vo;

import java.time.LocalDate;

/**
 * 前台足迹城市。只下发地图高亮和详情弹窗需要的字段。
 *
 * @author ParlisJade
 */
public record FootprintVO(Long id, String cityCode, String cityName,
                          String provinceCode, String provinceName,
                          LocalDate visitDate, String content,
                          Long photoCount, String coverPhotoUrl) {
}
