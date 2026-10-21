package com.god.thirdLine.service;

/** 站点配置服务。 */
public interface ISiteConfigService {

    /** 访客友链申请是否开启；配置不存在时默认开启。 */
    boolean isFriendLinkApplyEnabled();

    /** 设置访客友链申请开关。 */
    void setFriendLinkApplyEnabled(boolean enabled);

    /**
     * 读取任意站点配置；配置不存在或值为空时返回默认值。
     * 供留言墙等模块按 key 读取配置，避免每加一个配置就在本接口里加一个方法。
     */
    String getValue(String key, String defaultValue);

    /** 写入任意站点配置；不存在时新建，description 仅新建时使用。 */
    void setValue(String key, String value, String description);
}
