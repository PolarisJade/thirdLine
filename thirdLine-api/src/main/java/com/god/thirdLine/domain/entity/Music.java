package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;

import java.io.Serial;
import java.time.LocalDateTime;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * <p>
 * 音乐表
 * </p>
 *
 * @author ParlisJade
 * @since 2026-10-01
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_music")
public class Music implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 歌曲名
     */
    private String title;

    /**
     * 歌手/艺术家
     */
    private String artist;

    /**
     * 封面图URL
     */
    private String coverImage;

    /**
     * 音频文件URL（OSS 上传地址或第三方外链）
     */
    private String audioUrl;

    /**
     * 排序权重，越小越靠前
     */
    private Integer sort;

    /**
     * 状态：0下架/1上架
     */
    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
