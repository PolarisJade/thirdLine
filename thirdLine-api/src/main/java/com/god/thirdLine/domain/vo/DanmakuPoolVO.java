package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 弹幕池展示对象：全局开关 + 弹幕列表，前端拉取一次即可渲染
 *
 * @author ParlisJade
 */
@Data
public class DanmakuPoolVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 弹幕功能是否开启（管理端全局开关），关闭时前端不展示也不允许发送 */
    private Boolean enabled;

    /** 当前可展示的弹幕列表（status=1，按时间升序，取最近 limit 条） */
    private List<DanmakuVO> items;
}
