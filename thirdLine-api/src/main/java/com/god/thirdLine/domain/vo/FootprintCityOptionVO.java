package com.god.thirdLine.domain.vo;

/**
 * 城市下拉选项，供后台照片录入时选择所属城市。
 *
 * @author ParlisJade
 */
public record FootprintCityOptionVO(Long id, String cityCode, String cityName, String provinceName) {
}
