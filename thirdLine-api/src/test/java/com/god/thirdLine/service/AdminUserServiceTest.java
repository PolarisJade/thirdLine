package com.god.thirdLine.service;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.context.UserContext;
import com.god.thirdLine.domain.dto.AdminUserDTO;
import com.god.thirdLine.domain.entity.FriendLink;
import com.god.thirdLine.domain.entity.Article;
import com.god.thirdLine.domain.entity.User;
import com.god.thirdLine.domain.query.UserQuery;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.ArticleMapper;
import com.god.thirdLine.mapper.FriendLinkMapper;
import com.god.thirdLine.mapper.UserMapper;
import com.god.thirdLine.service.impl.AdminUserServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AdminUserServiceTest {
    private final UserMapper users = mock(UserMapper.class);
    private final ArticleMapper articles = mock(ArticleMapper.class);
    private final FriendLinkMapper links = mock(FriendLinkMapper.class);
    private final IOssReferenceService oss = mock(IOssReferenceService.class);
    private final SiteStatsCache cache = mock(SiteStatsCache.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private AdminUserServiceImpl service;

    @BeforeEach
    void setUp() {
        MapperBuilderAssistant assistant = new MapperBuilderAssistant(new MybatisConfiguration(), "unit-test");
        TableInfoHelper.initTableInfo(assistant, User.class);
        TableInfoHelper.initTableInfo(assistant, Article.class);
        TableInfoHelper.initTableInfo(assistant, FriendLink.class);
        service = new AdminUserServiceImpl(users, articles, links, encoder, oss, cache);
        UserContext.setUserId(1L);
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    void createsNormalUserWithNormalizedEmailAndHashedPassword() {
        AdminUserDTO dto = validDto();
        when(users.insert(any(User.class))).thenAnswer(invocation -> {
            invocation.<User>getArgument(0).setId(2L);
            return 1;
        });
        assertEquals(2L, service.createUser(dto));
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).insert(saved.capture());
        User user = saved.getValue();
        assertEquals("new-user", user.getUsername());
        assertEquals("user@example.com", user.getEmail());
        assertEquals("new-user", user.getNickname());
        assertEquals(User.ROLE_USER, user.getRole());
        assertEquals(1, user.getStatus());
        assertNotEquals(dto.getPassword(), user.getPassword());
        assertTrue(encoder.matches(dto.getPassword(), user.getPassword()));
        verify(cache).evictAfterCommit();
    }

    @Test
    void rejectsDuplicateUsernameAndEmail() {
        when(users.exists(any())).thenReturn(true);
        assertError(ResultCode.USERNAME_ALREADY_EXISTS, () -> service.createUser(validDto()));
        when(users.exists(any())).thenReturn(false, true);
        assertError(ResultCode.EMAIL_ALREADY_REGISTERED, () -> service.createUser(validDto()));
        verify(users, never()).insert(any(User.class));
        verifyNoInteractions(cache);
    }

    @Test
    void rejectsInvalidRolesStatusesAndPasswords() {
        AdminUserDTO dto = validDto();
        dto.setRole(2);
        assertError(ResultCode.PARAM_ERROR, () -> service.createUser(dto));
        dto.setRole(null);
        dto.setStatus(3);
        assertError(ResultCode.PARAM_ERROR, () -> service.createUser(dto));
        dto.setStatus(null);
        dto.setPassword("short");
        assertError(ResultCode.PARAM_ERROR, () -> service.createUser(dto));
        dto.setPassword("密".repeat(25));
        assertError(ResultCode.PARAM_ERROR, () -> service.createUser(dto));
        verify(users, never()).insert(any(User.class));
    }

    @Test
    void currentAdministratorCannotBeDeletedDisabledOrDemoted() {
        when(users.selectById(1L)).thenReturn(new User().setId(1L).setRole(0).setStatus(1));
        assertError(ResultCode.FORBIDDEN, () -> service.deleteUser(1L));
        AdminUserDTO dto = new AdminUserDTO();
        dto.setId(1L);
        dto.setStatus(0);
        assertError(ResultCode.FORBIDDEN, () -> service.updateUser(dto));
        dto.setStatus(1);
        dto.setRole(1);
        assertError(ResultCode.FORBIDDEN, () -> service.updateUser(dto));
        verify(users, never()).deleteById(anyLong());
        verify(users, never()).updateById(any(User.class));
        verifyNoInteractions(cache);
    }

    @Test
    void statusChangeOnlyWritesRequestedFields() {
        when(users.selectById(2L)).thenReturn(new User().setId(2L).setUsername("reader").setRole(1).setStatus(1));
        when(users.updateById(any(User.class))).thenReturn(1);
        AdminUserDTO dto = new AdminUserDTO();
        dto.setId(2L);
        dto.setStatus(0);
        service.updateUser(dto);
        ArgumentCaptor<User> patch = ArgumentCaptor.forClass(User.class);
        verify(users).updateById(patch.capture());
        assertEquals(0, patch.getValue().getStatus());
        assertNull(patch.getValue().getUsername());
        assertNull(patch.getValue().getPassword());
        assertNull(patch.getValue().getRole());
        assertNull(patch.getValue().getEmail());
        verify(cache).evictAfterCommit();
    }

    @Test
    void resetPasswordHashesNewPasswordAndDoesNotRequireOldPassword() {
        when(users.selectById(2L)).thenReturn(new User().setId(2L));
        when(users.updateById(any(User.class))).thenReturn(1);
        service.resetPassword(2L, "new-password");
        ArgumentCaptor<User> patch = ArgumentCaptor.forClass(User.class);
        verify(users).updateById(patch.capture());
        assertTrue(encoder.matches("new-password", patch.getValue().getPassword()));
        assertNull(patch.getValue().getRole());
        assertNull(patch.getValue().getStatus());
        verifyNoInteractions(cache);
    }

    @Test
    void cannotDeleteUserWhoHasArticles() {
        when(users.selectById(2L)).thenReturn(new User().setId(2L));
        when(articles.selectCount(any())).thenReturn(1L);
        assertError(ResultCode.PARAM_ERROR, () -> service.deleteUser(2L));
        verify(users, never()).deleteById(anyLong());
        verifyNoInteractions(links, oss, cache);
    }

    @Test
    void deletionPreservesApplicationsAndCleansUnusedAvatar() {
        when(users.selectById(2L)).thenReturn(new User().setId(2L).setAvatar("https://example.com/avatar.png"));
        when(articles.selectCount(any())).thenReturn(0L);
        when(users.deleteById(2L)).thenReturn(1);
        service.deleteUser(2L);
        verify(links).update(isNull(), org.mockito.ArgumentMatchers.<Wrapper<FriendLink>>any());
        verify(users).deleteById(2L);
        verify(oss).deleteIfUnused("https://example.com/avatar.png");
        verify(cache).evictAfterCommit();
    }

    @Test
    void missingUserIsRejectedAndPaginationIsBounded() {
        assertError(ResultCode.USER_NOT_FOUND, () -> service.resetPassword(99L, "password"));
        UserQuery query = new UserQuery();
        query.setPage(-1);
        query.setSize(10000);
        assertEquals(1, query.getPage());
        assertEquals(100, query.getSize());
    }

    private AdminUserDTO validDto() {
        AdminUserDTO dto = new AdminUserDTO();
        dto.setUsername(" new-user ");
        dto.setEmail(" USER@example.com ");
        dto.setPassword("password123");
        return dto;
    }

    private void assertError(ResultCode expected, Runnable action) {
        BusinessException exception = assertThrows(BusinessException.class, action::run);
        assertEquals(expected.getCode(), exception.getCode());
    }
}
