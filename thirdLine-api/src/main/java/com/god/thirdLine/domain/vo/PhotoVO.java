package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 照片展示对象
 *
 * @author ParlisJade
 */
@Data
public class PhotoVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    private String title;

    private String description;

    /** 所属城市行政区划代码；为空表示普通相册照片 */
    private String cityCode;

    private String url;

    private Integer width;

    private Integer height;

    private Long fileSize;

    private Integer sort;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
