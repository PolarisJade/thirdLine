package com.god.thirdLine.service;

/**
 * <p>
 * 站点配置 服务类
 * </p>
 * 以 key-value 形式维护全站开关，弹幕全局显隐即存于此处。
 *
 * @author ParlisJade
 */
public interface ISiteConfigService {

    /**
     * 弹幕功能是否开启；配置缺失时默认开启
     */
    boolean isDanmakuEnabled();

    /**
     * 设置弹幕全局开关
     *
     * @param enabled true 开启 / false 关闭
     */
    void setDanmakuEnabled(boolean enabled);
}
