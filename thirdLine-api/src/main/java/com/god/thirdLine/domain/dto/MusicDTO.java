package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 音乐新增 / 修改请求参数。
 * 新增时 id 为空，修改时 id 必填。
 *
 * @author ParlisJade
 */
@Data
public class MusicDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 音乐ID（修改时必填） */
    private Long id;

    /** 歌曲名（必填） */
    private String title;

    /** 歌手/艺术家 */
    private String artist;

    /** 封面图URL */
    private String coverImage;

    /** 音频文件URL（OSS 上传地址或第三方外链；新增必填，局部修改时可不传） */
    private String audioUrl;

    /** 排序权重，越小越靠前；为空时自动追加到末尾 */
    private Integer sort;

    /** 状态：0下架/1上架，默认上架 */
    private Integer status;
}
