package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 留言墙-提交留言
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallNoteCreateDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 留言正文，必填 */
    private String content;

    /** 信纸颜色 key，必填，需在 wall_palette 白名单内 */
    private String paperColor;

    /** 期望的信纸左上角 X（逻辑画布坐标） */
    private Double posX;

    /** 期望的信纸左上角 Y（逻辑画布坐标） */
    private Double posY;
}
