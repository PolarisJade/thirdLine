package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.god.thirdLine.domain.entity.SiteConfig;
import com.god.thirdLine.mapper.SiteConfigMapper;
import com.god.thirdLine.service.ISiteConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** 站点配置服务实现。 */
@Service
@RequiredArgsConstructor
public class SiteConfigServiceImpl implements ISiteConfigService {

    private static final String VALUE_ON = "1";
    private static final String VALUE_OFF = "0";

    private final SiteConfigMapper siteConfigMapper;

    @Override
    public boolean isFriendLinkApplyEnabled() {
        SiteConfig config = getByKey(SiteConfig.KEY_FRIEND_LINK_APPLY_ENABLED);
        return config == null || config.getConfigValue() == null || VALUE_ON.equals(config.getConfigValue());
    }

    @Override
    public void setFriendLinkApplyEnabled(boolean enabled) {
        String value = enabled ? VALUE_ON : VALUE_OFF;
        SiteConfig config = getByKey(SiteConfig.KEY_FRIEND_LINK_APPLY_ENABLED);
        if (config == null) {
            siteConfigMapper.insert(new SiteConfig()
                    .setConfigKey(SiteConfig.KEY_FRIEND_LINK_APPLY_ENABLED)
                    .setConfigValue(value)
                    .setDescription("访客友链申请开关：1开启/0关闭，关闭后前台不展示申请入口且接口拒绝申请"));
            return;
        }
        config.setConfigValue(value);
        siteConfigMapper.updateById(config);
    }

    private SiteConfig getByKey(String key) {
        return siteConfigMapper.selectOne(Wrappers.<SiteConfig>lambdaQuery()
                .eq(SiteConfig::getConfigKey, key), false);
    }
}
