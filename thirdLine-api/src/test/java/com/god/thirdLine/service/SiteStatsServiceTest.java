package com.god.thirdLine.service;

import com.god.thirdLine.common.RedisKeys;
import com.god.thirdLine.config.HostProperties;
import com.god.thirdLine.domain.vo.SiteStatsVO;
import com.god.thirdLine.mapper.ArticleMapper;
import com.god.thirdLine.mapper.CategoryMapper;
import com.god.thirdLine.mapper.PhotoMapper;
import com.god.thirdLine.mapper.TagMapper;
import com.god.thirdLine.mapper.UserMapper;
import com.god.thirdLine.service.impl.SiteStatsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SiteStatsServiceTest {
    private final ArticleMapper articles = mock(ArticleMapper.class);
    private final CategoryMapper categories = mock(CategoryMapper.class);
    private final TagMapper tags = mock(TagMapper.class);
    private final PhotoMapper photos = mock(PhotoMapper.class);
    private final UserMapper users = mock(UserMapper.class);
    private final StringRedisTemplate redis = mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked")
    private final ValueOperations<String, String> values = mock(ValueOperations.class);
    private final JsonMapper json = JsonMapper.builder().build();
    private SiteStatsServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SiteStatsServiceImpl(articles, categories, tags, photos, users,
                new HostProperties(), redis, json);
        when(redis.opsForValue()).thenReturn(values);
        when(articles.selectCount(any())).thenReturn(12L);
        when(categories.selectCount(isNull())).thenReturn(3L);
        when(tags.selectCount(isNull())).thenReturn(7L);
        when(photos.selectCount(any())).thenReturn(8L);
        when(users.selectCount(isNull())).thenReturn(5L);
    }

    @Test
    void cacheHitReturnsCachedStatsWithoutQueryingDatabase() {
        when(values.get(RedisKeys.SITE_STATS)).thenReturn(
                "{\"articleCount\":21,\"categoryCount\":4,\"tagCount\":9,\"photoCount\":13,\"userCount\":16}");

        SiteStatsVO stats = service.getSiteStats();

        assertEquals(21L, stats.getArticleCount());
        assertEquals(16L, stats.getUserCount());
        verifyNoInteractions(articles, categories, tags, photos, users);
        verify(values, never()).set(anyString(), anyString(), any(Duration.class));
    }

    @Test
    void cacheMissQueriesDatabaseAndCachesCompleteStatsWithTtl() {
        SiteStatsVO stats = service.getSiteStats();

        assertEquals(12L, stats.getArticleCount());
        assertEquals(3L, stats.getCategoryCount());
        assertEquals(7L, stats.getTagCount());
        assertEquals(8L, stats.getPhotoCount());
        assertEquals(5L, stats.getUserCount());
        verify(users).selectCount(isNull());
        ArgumentCaptor<String> saved = ArgumentCaptor.forClass(String.class);
        verify(values).set(eq(RedisKeys.SITE_STATS), saved.capture(), eq(Duration.ofHours(12)));
        assertEquals(stats, json.readValue(saved.getValue(), SiteStatsVO.class));
    }

    @Test
    void configuredTtlIsUsed() {
        ReflectionTestUtils.setField(service, "cacheTtlSeconds", 120L);
        service.getSiteStats();
        verify(values).set(eq(RedisKeys.SITE_STATS), anyString(), eq(Duration.ofSeconds(120)));
    }

    @Test
    void invalidIncompleteOrBlankCacheIsRebuiltFromDatabase() {
        for (String cached : new String[] { "not-json", "{}", "null", " ",
                "{\"articleCount\":1,\"categoryCount\":2,\"tagCount\":3,\"photoCount\":4}" }) {
            when(values.get(RedisKeys.SITE_STATS)).thenReturn(cached);
            assertEquals(5L, service.getSiteStats().getUserCount());
        }
        verify(values, times(5)).set(eq(RedisKeys.SITE_STATS), anyString(), eq(Duration.ofHours(12)));
    }

    @Test
    void redisReadFailureFallsBackToDatabase() {
        when(values.get(RedisKeys.SITE_STATS)).thenThrow(new DataAccessResourceFailureException("Redis unavailable"));
        assertEquals(5L, service.getSiteStats().getUserCount());
        verify(users).selectCount(isNull());
    }

    @Test
    void redisWriteFailureStillReturnsDatabaseStats() {
        doThrow(new DataAccessResourceFailureException("Redis unavailable"))
                .when(values).set(eq(RedisKeys.SITE_STATS), anyString(), any(Duration.class));
        assertEquals(5L, service.getSiteStats().getUserCount());
    }

    @Test
    void databaseFailureDoesNotCachePartialStats() {
        when(users.selectCount(isNull())).thenThrow(new DataAccessResourceFailureException("Database unavailable"));
        assertThrows(DataAccessResourceFailureException.class, service::getSiteStats);
        verify(values, never()).set(anyString(), anyString(), any(Duration.class));
    }
}
