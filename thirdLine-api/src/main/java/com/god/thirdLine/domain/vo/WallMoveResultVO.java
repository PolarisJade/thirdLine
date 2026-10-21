package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 留言墙-拖动确认后的结果
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallMoveResultVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    /** 服务端最终采用的左上角 X */
    private Double posX;

    /** 服务端最终采用的左上角 Y */
    private Double posY;

    /** 更新后的版本号 */
    private Integer version;

    /** 服务端是否对位置做了调整（落点被占、被夹到画布内等），前端据此给个提示 */
    private Boolean adjusted;
}
