package com.god.thirdLine.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.god.thirdLine.domain.vo.ArticleArchiveEntryVO;
import com.god.thirdLine.mapper.ArticleMapper;
import com.god.thirdLine.mapper.ArticleTagMapper;
import com.god.thirdLine.mapper.CategoryMapper;
import com.god.thirdLine.mapper.TagMapper;
import com.god.thirdLine.service.impl.ArticleServiceImpl;
import com.god.thirdLine.util.ObjectStorageUtil;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.io.Resources;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ArticleArchiveServiceTest {
    private final ArticleMapper mapper = mock(ArticleMapper.class);
    private final ArticleServiceImpl service = new ArticleServiceImpl(mock(ArticleTagMapper.class),
            mock(TagMapper.class), mock(CategoryMapper.class), mock(ObjectStorageUtil.class),
            mock(IOssReferenceService.class), mock(SiteStatsCache.class));

    @Test
    void groupsByPublicationDateAcrossMidnightMonthAndYearBoundaries() {
        ReflectionTestUtils.setField(service, "baseMapper", mapper);
        when(mapper.selectPublishedArticlesForArchive()).thenReturn(List.of(
                article(3L, "2026-10-23T23:59:59"), article(100L, "2026-10-23T00:00:00"),
                article(2L, "2026-09-30T23:59:59"), article(200L, "2025-12-31T23:59:59")));

        var archive = service.listArticleArchive();
        assertEquals(List.of(LocalDate.of(2026, 10, 23), LocalDate.of(2026, 9, 30),
                LocalDate.of(2025, 12, 31)), archive.stream().map(day -> day.getDate()).toList());
        assertEquals(List.of(3L, 100L), archive.getFirst().getArticles().stream()
                .map(ArticleArchiveEntryVO::getId).toList());
        assertEquals(1, archive.getLast().getArticles().size());
    }

    @Test
    void emptyArchiveReturnsEmptyList() {
        ReflectionTestUtils.setField(service, "baseMapper", mapper);
        when(mapper.selectPublishedArticlesForArchive()).thenReturn(List.of());
        assertTrue(service.listArticleArchive().isEmpty());
    }

    @Test
    void archiveSqlExcludesDraftsDeletedAndUndatedArticlesAndOrdersByPublication() throws Exception {
        var configuration = new MybatisConfiguration();
        String resource = "mapper/ArticleMapper.xml";
        try (var input = Resources.getResourceAsStream(resource)) {
            new XMLMapperBuilder(input, configuration, resource, configuration.getSqlFragments()).parse();
        }
        String sql = configuration.getMappedStatement(ArticleMapper.class.getName()
                + ".selectPublishedArticlesForArchive").getBoundSql(null).getSql().replaceAll("\\s+", " ");
        assertTrue(sql.contains("WHERE a.status = 1 AND a.published_time IS NOT NULL"));
        assertTrue(sql.contains("ORDER BY a.published_time DESC, a.id DESC"));
        assertFalse(sql.contains("a.content"));
        assertFalse(sql.contains("LIMIT"));
    }

    private ArticleArchiveEntryVO article(long id, String publishedTime) {
        var article = new ArticleArchiveEntryVO();
        article.setId(id);
        article.setTitle("文章 " + id);
        article.setPublishedTime(LocalDateTime.parse(publishedTime));
        return article;
    }
}
