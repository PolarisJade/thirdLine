package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 留言墙-整面墙的数据
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallListVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 当前可见的信纸 */
    private List<WallNoteVO> notes;

    /**
     * 墙面版本号（取所有可见留言 update_time 的最大值，空墙为 0），
     * 前端轮询时用它判断需不需要重绘，避免每次都把整面墙换一遍。
     */
    private Long version;

    /** 单面墙容量 */
    private Integer maxNotes;
}
