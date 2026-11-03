package com.god.thirdLine.common;

/**
 * Redis key 的统一定义与构建。
 */
public final class RedisKeys {

    /** 首页及后台数据看板共用的站点统计。 */
    public static final String SITE_STATS = "thirdline:site:stats";

    private static final String REGISTER_EMAIL_CODE_PREFIX = "thirdline:register:email-code:";
    private static final String CODE_SUFFIX = ":code";
    private static final String INTERVAL_SUFFIX = ":interval";

    private RedisKeys() {
    }

    /** 注册邮箱验证码。 */
    public static String registerEmailCode(String email) {
        return registerEmailPrefix(email) + CODE_SUFFIX;
    }

    /** 同一邮箱的验证码发送限频记录。 */
    public static String registerEmailCodeInterval(String email) {
        return registerEmailPrefix(email) + INTERVAL_SUFFIX;
    }

    /** 同一邮箱使用相同的 hash tag，确保 Lua 多 key 操作兼容 Redis Cluster。 */
    private static String registerEmailPrefix(String email) {
        return REGISTER_EMAIL_CODE_PREFIX + "{" + email + "}";
    }
}
