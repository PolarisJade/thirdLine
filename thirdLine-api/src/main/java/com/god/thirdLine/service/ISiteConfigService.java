package com.god.thirdLine.service;

/** 站点配置服务。 */
public interface ISiteConfigService {

    /** 访客友链申请是否开启；配置不存在时默认开启。 */
    boolean isFriendLinkApplyEnabled();

    /** 设置访客友链申请开关。 */
    void setFriendLinkApplyEnabled(boolean enabled);
}
