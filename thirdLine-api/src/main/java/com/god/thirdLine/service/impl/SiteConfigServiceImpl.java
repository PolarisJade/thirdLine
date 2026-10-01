package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.god.thirdLine.domain.entity.SiteConfig;
import com.god.thirdLine.mapper.SiteConfigMapper;
import com.god.thirdLine.service.ISiteConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * <p>
 * 站点配置 服务实现类
 * </p>
 *
 * @author ParlisJade
 */
@Service
@RequiredArgsConstructor
public class SiteConfigServiceImpl implements ISiteConfigService {

    private static final String VALUE_ON = "1";
    private static final String VALUE_OFF = "0";

    private final SiteConfigMapper siteConfigMapper;

    @Override
    public boolean isDanmakuEnabled() {
        SiteConfig config = getByKey(SiteConfig.KEY_DANMAKU_ENABLED);
        // 配置缺失时默认开启，保证未初始化环境也可用
        if (config == null || config.getConfigValue() == null) {
            return true;
        }
        return VALUE_ON.equals(config.getConfigValue());
    }

    @Override
    public void setDanmakuEnabled(boolean enabled) {
        String value = enabled ? VALUE_ON : VALUE_OFF;
        SiteConfig config = getByKey(SiteConfig.KEY_DANMAKU_ENABLED);
        LocalDateTime now = LocalDateTime.now();
        if (config == null) {
            SiteConfig entity = new SiteConfig()
                    .setConfigKey(SiteConfig.KEY_DANMAKU_ENABLED)
                    .setConfigValue(value)
                    .setDescription("弹幕全局开关：1开启/0关闭，关闭后前台不再展示弹幕且禁止发送")
                    .setCreateTime(now)
                    .setUpdateTime(now);
            siteConfigMapper.insert(entity);
        } else {
            config.setConfigValue(value).setUpdateTime(now);
            siteConfigMapper.updateById(config);
        }
    }

    private SiteConfig getByKey(String key) {
        return siteConfigMapper.selectOne(Wrappers.<SiteConfig>lambdaQuery()
                .eq(SiteConfig::getConfigKey, key), false);
    }
}
