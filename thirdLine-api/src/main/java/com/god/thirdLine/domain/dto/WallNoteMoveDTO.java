package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 留言墙-拖动后确认位置
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallNoteMoveDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 目标左上角 X（逻辑画布坐标） */
    private Double posX;

    /** 目标左上角 Y（逻辑画布坐标） */
    private Double posY;

    /** 客户端持有的版本号，用于乐观锁；必填 */
    private Integer version;
}
