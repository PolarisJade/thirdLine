package com.god.thirdLine.context;

/**
 * 基于 ThreadLocal 的登录用户上下文，由 JWT 拦截器写入，请求结束时清理
 *
 * @author ParlisJade
 */
public class UserContext {

    private static final ThreadLocal<Long> CURRENT_USER = new ThreadLocal<>();

    private UserContext() {
    }

    public static void setUserId(Long userId) {
        CURRENT_USER.set(userId);
    }

    public static Long getUserId() {
        return CURRENT_USER.get();
    }

    public static void clear() {
        CURRENT_USER.remove();
    }
}
