package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.god.thirdLine.common.RedisKeys;
import com.god.thirdLine.config.HostProperties;
import com.god.thirdLine.domain.entity.Article;
import com.god.thirdLine.domain.entity.Photo;
import com.god.thirdLine.domain.vo.SiteProfileVO;
import com.god.thirdLine.domain.vo.SiteStatsVO;
import com.god.thirdLine.mapper.ArticleMapper;
import com.god.thirdLine.mapper.CategoryMapper;
import com.god.thirdLine.mapper.PhotoMapper;
import com.god.thirdLine.mapper.TagMapper;
import com.god.thirdLine.mapper.UserMapper;
import com.god.thirdLine.service.ISiteStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;

/**
 * 网站基本信息统计 服务实现
 *
 * @author ParlisJade
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SiteStatsServiceImpl implements ISiteStatsService {

    /** 文章状态：已发布 */
    private static final int ARTICLE_STATUS_PUBLISHED = 1;

    /** 照片状态：显示 */
    private static final int PHOTO_STATUS_VISIBLE = 1;

    private final ArticleMapper articleMapper;
    private final CategoryMapper categoryMapper;
    private final TagMapper tagMapper;
    private final PhotoMapper photoMapper;
    private final UserMapper userMapper;
    private final HostProperties hostProperties;
    private final StringRedisTemplate redisTemplate;
    private final JsonMapper jsonMapper;

    @Value("${site-stats.cache-ttl-seconds:43200}")
    private long cacheTtlSeconds = 43200;

    @Override
    public SiteStatsVO getSiteStats() {
        SiteStatsVO cached = readCachedStats();
        if (cached != null) {
            return cached;
        }

        SiteStatsVO stats = querySiteStats();
        try {
            redisTemplate.opsForValue().set(RedisKeys.SITE_STATS, jsonMapper.writeValueAsString(stats),
                    Duration.ofSeconds(Math.max(1, cacheTtlSeconds)));
        } catch (DataAccessException | JacksonException e) {
            log.warn("站点统计写入 Redis 失败，返回数据库查询结果", e);
        }
        return stats;
    }

    private SiteStatsVO readCachedStats() {
        try {
            String json = redisTemplate.opsForValue().get(RedisKeys.SITE_STATS);
            if (StringUtils.hasText(json)) {
                SiteStatsVO stats = jsonMapper.readValue(json, SiteStatsVO.class);
                // 不完整的旧版本缓存也按未命中处理，避免新增指标长期显示为 0。
                if (stats != null && stats.getArticleCount() != null && stats.getCategoryCount() != null
                        && stats.getTagCount() != null && stats.getPhotoCount() != null && stats.getUserCount() != null) {
                    return stats;
                }
            }
        } catch (DataAccessException | JacksonException e) {
            log.warn("站点统计缓存读取失败，改从数据库查询", e);
        }
        return null;
    }

    private SiteStatsVO querySiteStats() {
        SiteStatsVO vo = new SiteStatsVO();
        vo.setArticleCount(articleMapper.selectCount(
                new LambdaQueryWrapper<Article>()
                        .eq(Article::getStatus, ARTICLE_STATUS_PUBLISHED)));
        vo.setCategoryCount(categoryMapper.selectCount(null));
        vo.setTagCount(tagMapper.selectCount(null));
        vo.setUserCount(userMapper.selectCount(null));
        vo.setPhotoCount(photoMapper.selectCount(
                new LambdaQueryWrapper<Photo>()
                        .eq(Photo::getStatus, PHOTO_STATUS_VISIBLE)));
        return vo;
    }

    @Override
    public SiteProfileVO getSiteProfile() {
        SiteProfileVO vo = new SiteProfileVO();
        vo.setNickname(hostProperties.getNickname());
        vo.setEmail(hostProperties.getEmail());
        vo.setGithub(hostProperties.getGithub());
        vo.setAvatar(hostProperties.getAvatar());
        vo.setStartTime(hostProperties.getStartTime());
        return vo;
    }
}
