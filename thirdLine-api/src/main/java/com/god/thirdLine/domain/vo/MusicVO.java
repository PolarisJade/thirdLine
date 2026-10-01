package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 音乐展示对象
 *
 * @author ParlisJade
 */
@Data
public class MusicVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    private String title;

    private String artist;

    private String coverImage;

    /** 音频文件URL（OSS 上传地址或第三方外链） */
    private String audioUrl;

    /** 排序权重，越小越靠前 */
    private Integer sort;

    /** 状态：0下架/1上架 */
    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
