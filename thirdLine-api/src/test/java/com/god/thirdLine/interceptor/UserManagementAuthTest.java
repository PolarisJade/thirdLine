package com.god.thirdLine.interceptor;

import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.config.JwtProperties;
import com.god.thirdLine.context.UserContext;
import com.god.thirdLine.domain.entity.User;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.UserMapper;
import com.god.thirdLine.util.JwtUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserManagementAuthTest {
    private final JwtProperties properties = new JwtProperties();
    private final JwtUtil jwt = new JwtUtil(properties);
    private final UserMapper users = mock(UserMapper.class);
    private final JwtInterceptor admin = new JwtInterceptor(jwt, properties, users);
    private final UserJwtInterceptor frontend = new UserJwtInterceptor(jwt, properties, users);

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    void deletedAndDisabledUsersCannotUseExistingTokens() {
        for (User user : new User[] { null, new User().setId(2L).setRole(0).setStatus(0) }) {
            when(users.selectById(2L)).thenReturn(user);
            MockHttpServletRequest request = request(0);
            assertError(ResultCode.UNAUTHORIZED, () -> admin.preHandle(request, new MockHttpServletResponse(), null));
            assertError(ResultCode.UNAUTHORIZED, () -> frontend.preHandle(request, new MockHttpServletResponse(), null));
        }
        assertNull(UserContext.getUserId());
    }

    @Test
    void demotionRevokesAdminAccessEvenWithAdminToken() {
        when(users.selectById(2L)).thenReturn(new User().setId(2L).setRole(1).setStatus(1));
        assertError(ResultCode.FORBIDDEN, () -> admin.preHandle(request(0), new MockHttpServletResponse(), null));
        assertTrue(frontend.preHandle(request(0), new MockHttpServletResponse(), null));
    }

    @Test
    void normalUserTokenCannotAccessAdminApis() {
        when(users.selectById(2L)).thenReturn(new User().setId(2L).setRole(1).setStatus(1));
        assertError(ResultCode.FORBIDDEN, () -> admin.preHandle(request(1), new MockHttpServletResponse(), null));
    }

    @Test
    void activeAdminIsAllowedAndRequestContextIsCleared() {
        when(users.selectById(2L)).thenReturn(new User().setId(2L).setRole(0).setStatus(1));
        MockHttpServletRequest request = request(0);
        MockHttpServletResponse response = new MockHttpServletResponse();
        assertTrue(admin.preHandle(request, response, null));
        assertEquals(2L, UserContext.getUserId());
        admin.afterCompletion(request, response, null, null);
        assertNull(UserContext.getUserId());
    }

    private MockHttpServletRequest request(int role) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/admin/user/page");
        request.addHeader("Authorization", "Bearer " + jwt.generateToken(2L, "reader", role));
        return request;
    }

    private void assertError(ResultCode expected, Runnable action) {
        BusinessException exception = assertThrows(BusinessException.class, action::run);
        assertEquals(expected.getCode(), exception.getCode());
    }
}
