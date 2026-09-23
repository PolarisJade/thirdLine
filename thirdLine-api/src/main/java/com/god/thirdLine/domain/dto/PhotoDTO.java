package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 照片新增 / 修改请求参数。
 * 新增时 id 为空，修改时 id 必填。
 *
 * @author ParlisJade
 */
@Data
public class PhotoDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 照片ID（修改时必填） */
    private Long id;

    /** 照片标题 */
    private String title;

    /** 照片描述 */
    private String description;

    /** 原图访问URL（新增必填） */
    private String url;

    /** 图片宽度（像素） */
    private Integer width;

    /** 图片高度（像素） */
    private Integer height;

    /** 文件大小（字节） */
    private Long fileSize;

    /** 排序权重，越小越靠前；新增时为空则自动追加到末尾 */
    private Integer sort;

    /** 状态：0隐藏/1显示，默认显示 */
    private Integer status;
}
