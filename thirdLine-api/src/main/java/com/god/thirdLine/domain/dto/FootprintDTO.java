package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * 足迹新增 / 修改请求参数。新增时 id 为空，修改时 id 必填。
 *
 * @author ParlisJade
 */
@Data
public class FootprintDTO {

    private Long id;

    /** 市级行政区划代码，6 位数字，必填 */
    private String cityCode;

    /** 城市名称，必填 */
    private String cityName;

    /** 省级行政区划代码，6 位数字，必填 */
    private String provinceCode;

    /** 省级行政区名称，必填 */
    private String provinceName;

    /** 到访日期，可空 */
    private LocalDate visitDate;

    /** 城市评价，可空 */
    private String content;

    /** 0 草稿 / 1 已发布，新增缺省为草稿 */
    private Integer publishStatus;

    /** 0 隐藏 / 1 显示，新增缺省为显示 */
    private Integer status;
}
