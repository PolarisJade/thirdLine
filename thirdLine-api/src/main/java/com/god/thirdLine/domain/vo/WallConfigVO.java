package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 留言墙-前台配置。
 * <p>
 * 画布与信纸尺寸由服务端统一下发，前端不再写死一份，
 * 避免「前端预览的位置」和「服务端裁决的位置」用两套参数。
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Data
public class WallConfigVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 总开关：关闭后只读 */
    private Boolean enabled;

    /** 发布须知 */
    private String notice;

    /** 单条最大字数 */
    private Integer maxLength;

    /** 单面墙最多展示条数 */
    private Integer maxNotes;

    /** 逻辑画布宽 */
    private Double canvasWidth;

    /** 逻辑画布高 */
    private Double canvasHeight;

    /** 信纸宽 */
    private Double paperWidth;

    /** 信纸高 */
    private Double paperHeight;

    /** 信纸间安全间距 */
    private Double gap;

    /** 坐标吸附粒度 */
    private Double grid;

    /** 可选信纸颜色 */
    private List<WallColorVO> palette;
}
