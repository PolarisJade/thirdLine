package com.god.thirdLine.service;

import com.god.thirdLine.domain.dto.*;
import com.god.thirdLine.domain.entity.*;
import com.god.thirdLine.mapper.*;
import com.god.thirdLine.service.impl.*;
import com.god.thirdLine.util.JwtUtil;
import com.god.thirdLine.util.ObjectStorageUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** 检查影响首页统计的各个业务入口都触发缓存失效。 */
class SiteStatsMutationTest {
    private final SiteStatsCache cache = mock(SiteStatsCache.class);
    private final IOssReferenceService oss = mock(IOssReferenceService.class);
    private final ObjectStorageUtil storage = mock(ObjectStorageUtil.class);

    @ParameterizedTest
    @ValueSource(strings = { "create", "update", "delete" })
    void articleMutationsInvalidateStats(String operation) {
        CategoryMapper categories = mock(CategoryMapper.class);
        when(categories.selectById(1L)).thenReturn(new Category().setId(1L));
        ArticleServiceImpl service = spy(new ArticleServiceImpl(mock(ArticleTagMapper.class),
                mock(TagMapper.class), categories, storage, oss, cache));
        doReturn(true).when(service).save(any(Article.class));
        doReturn(true).when(service).updateById(any(Article.class));
        doReturn(true).when(service).removeById(1L);
        doReturn(new Article().setId(1L).setStatus(1)).when(service).getById(1L);

        switch (operation) {
            case "create" -> {
                ArticleSaveDTO dto = new ArticleSaveDTO();
                dto.setTitle("测试文章");
                dto.setCategoryId(1L);
                service.saveArticle(1L, dto);
            }
            case "update" -> {
                ArticleUpdateDTO dto = new ArticleUpdateDTO();
                dto.setId(1L);
                dto.setStatus(0);
                service.updateArticle(dto);
            }
            case "delete" -> service.deleteArticle(1L);
        }
        verify(cache).evictAfterCommit();
    }

    @ParameterizedTest
    @ValueSource(strings = { "create", "update", "delete" })
    void categoryMutationsInvalidateStats(String operation) {
        CategoryServiceImpl service = spy(new CategoryServiceImpl(mock(ArticleMapper.class), cache));
        ReflectionTestUtils.setField(service, "baseMapper", mock(CategoryMapper.class));
        doReturn(true).when(service).save(any(Category.class));
        doReturn(true).when(service).updateById(any(Category.class));
        doReturn(true).when(service).removeById(1L);
        doReturn(new Category().setId(1L).setName("分类")).when(service).getById(1L);
        CategoryDTO dto = new CategoryDTO();
        dto.setId(1L);
        dto.setName("分类");

        switch (operation) {
            case "create" -> service.saveCategory(dto);
            case "update" -> service.updateCategory(dto);
            case "delete" -> service.deleteCategory(1L);
        }
        verify(cache).evictAfterCommit();
    }

    @ParameterizedTest
    @ValueSource(strings = { "create", "update", "delete" })
    void tagMutationsInvalidateStats(String operation) {
        TagServiceImpl service = spy(new TagServiceImpl(mock(ArticleTagMapper.class), cache));
        ReflectionTestUtils.setField(service, "baseMapper", mock(TagMapper.class));
        doReturn(true).when(service).save(any(Tag.class));
        doReturn(true).when(service).updateById(any(Tag.class));
        doReturn(true).when(service).removeById(1L);
        doReturn(new Tag().setId(1L).setName("标签")).when(service).getById(1L);
        TagDTO dto = new TagDTO();
        dto.setId(1L);
        dto.setName("标签");

        switch (operation) {
            case "create" -> service.saveTag(dto);
            case "update" -> service.updateTag(dto);
            case "delete" -> service.deleteTag(1L);
        }
        verify(cache).evictAfterCommit();
    }

    @ParameterizedTest
    @ValueSource(strings = { "create", "update", "delete" })
    void photoMutationsInvalidateStats(String operation) {
        PhotoServiceImpl service = spy(new PhotoServiceImpl(storage, oss, cache));
        doReturn(true).when(service).save(any(Photo.class));
        doReturn(true).when(service).updateById(any(Photo.class));
        doReturn(true).when(service).removeById(1L);
        doReturn(new Photo().setId(1L).setStatus(1)).when(service).getById(1L);
        PhotoDTO dto = new PhotoDTO();
        dto.setId(1L);
        dto.setSort(1);
        dto.setUrl("https://example.com/photo.jpg");
        dto.setStatus(0);

        switch (operation) {
            case "create" -> service.savePhoto(dto);
            case "update" -> service.updatePhoto(dto);
            case "delete" -> service.deletePhoto(1L);
        }
        verify(cache).evictAfterCommit();
    }

    @Test
    void registrationInvalidatesStatsAfterSavingUser() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        JwtUtil jwt = mock(JwtUtil.class);
        UserServiceImpl service = spy(new UserServiceImpl(encoder, jwt, mock(EmailCodeService.class), oss, cache));
        doReturn(false).when(service).exists(any());
        doReturn(true).when(service).save(any(User.class));
        RegisterDTO dto = new RegisterDTO();
        dto.setUsername("new-user");
        dto.setEmail("user@example.com");
        dto.setCode("123456");
        dto.setPassword("password123");

        service.register(dto);

        var order = inOrder(service, cache);
        order.verify(service).save(any(User.class));
        order.verify(cache).evictAfterCommit();
    }

    @Test
    void unsuccessfulDatabaseWriteDoesNotInvalidateStats() {
        PhotoServiceImpl service = spy(new PhotoServiceImpl(storage, oss, cache));
        doReturn(new Photo().setId(1L)).when(service).getById(1L);
        doReturn(false).when(service).updateById(any(Photo.class));
        PhotoDTO dto = new PhotoDTO();
        dto.setId(1L);
        dto.setStatus(0);

        service.updatePhoto(dto);

        verifyNoInteractions(cache);
    }
}
