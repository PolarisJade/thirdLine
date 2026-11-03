package com.god.thirdLine.service;

import com.god.thirdLine.common.RedisKeys;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * 注册邮箱验证码服务：生成并发送验证码、限频、校验。
 * <p>
 * 验证码与发送限频状态保存在 Redis，通过 TTL 自动过期，支持多实例共享。
 * 使用 Lua 脚本原子地完成发送限频与验证码消费，防止并发重复发送、重复使用。
 * <p>
 * 邮件发送交给 {@link MailService} 的独立线程池异步完成，接口不会等待 SMTP。
 *
 * @author ParlisJade
 */
@Service
public class EmailCodeService {

    private static final SecureRandom RANDOM = new SecureRandom();

    /** 邮箱格式，与注册接口保持同一套规则；异步发送后 SMTP 失败不会同步报错，先在这里挡住明显非法地址 */
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$");

    /** 原子完成发送限频检查与验证码存储。 */
    private static final DefaultRedisScript<Long> STORE_SCRIPT = new DefaultRedisScript<>("""
            if redis.call('EXISTS', KEYS[2]) == 1 then
                return 0
            end
            redis.call('SET', KEYS[1], ARGV[1], 'PX', ARGV[2])
            redis.call('SET', KEYS[2], ARGV[3], 'PX', ARGV[4])
            return 1
            """, Long.class);

    private static final DefaultRedisScript<Long> VERIFY_SCRIPT = new DefaultRedisScript<>("""
            if redis.call('GET', KEYS[1]) == ARGV[1] then
                return redis.call('DEL', KEYS[1])
            end
            return 0
            """, Long.class);

    /** 仅撤销本次发送，避免旧请求提交失败时误删后续请求的验证码。 */
    private static final DefaultRedisScript<Long> ROLLBACK_SCRIPT = new DefaultRedisScript<>("""
            if redis.call('GET', KEYS[2]) == ARGV[1] then
                return redis.call('DEL', KEYS[1], KEYS[2])
            end
            return 0
            """, Long.class);

    private final MailService mailService;
    private final StringRedisTemplate redisTemplate;

    @Value("${email-code.subject:【thirdLine】邮箱验证码}")
    private String subject;

    @Value("${email-code.expire-minutes:10}")
    private long expireMinutes;

    @Value("${email-code.send-interval-seconds:60}")
    private long sendIntervalSeconds;

    public EmailCodeService(MailService mailService, StringRedisTemplate redisTemplate) {
        this.mailService = mailService;
        this.redisTemplate = redisTemplate;
    }

    /**
     * 向邮箱发送 6 位数字验证码；同一邮箱在限频窗口内不可重复发送。
     * <p>
     * 验证码会先写入 Redis，再把邮件任务提交到线程池，因此接口返回时
     * 邮件可能还在发送中，但用户收到邮件后立即提交注册一定可以通过校验。
     */
    public void sendCode(String email) {
        if (email == null || email.isBlank() || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "邮箱格式不正确");
        }
        if (!mailService.isConfigured()) {
            throw new BusinessException(ResultCode.EMAIL_SEND_FAILED, "邮件服务未配置，请先在 application.yml 填写 spring.mail 信息");
        }
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        String requestId = UUID.randomUUID().toString();
        List<String> keys = List.of(RedisKeys.registerEmailCode(email), RedisKeys.registerEmailCodeInterval(email));
        Long stored = redisTemplate.execute(STORE_SCRIPT, keys, code,
                String.valueOf(Duration.ofMinutes(expireMinutes).toMillis()), requestId,
                String.valueOf(Duration.ofSeconds(sendIntervalSeconds).toMillis()));
        if (!Long.valueOf(1).equals(stored)) {
            throw new BusinessException(ResultCode.EMAIL_CODE_SEND_TOO_FREQUENT);
        }

        // 异步发送，不阻塞当前请求线程；SMTP 失败只在后台记录日志，提交失败则提示用户重试
        boolean queued = mailService.sendAsync(email, subject,
                "您的验证码是：" + code + "，" + expireMinutes + " 分钟内有效。\n"
                        + "若非本人操作，请忽略本邮件。");
        if (!queued) {
            // 线程池已满等提交失败：撤销刚写入的验证码，让用户可以立即重试
            redisTemplate.execute(ROLLBACK_SCRIPT, keys, requestId);
            throw new BusinessException(ResultCode.EMAIL_SEND_FAILED);
        }
    }

    /**
     * 校验验证码；校验通过后立即移除，防止重用
     */
    public void verifyCode(String email, String code) {
        if (email == null || email.isBlank() || code == null || code.isBlank()) {
            throw new BusinessException(ResultCode.EMAIL_CODE_ERROR);
        }
        Long verified = redisTemplate.execute(VERIFY_SCRIPT, List.of(RedisKeys.registerEmailCode(email)), code);
        if (!Long.valueOf(1).equals(verified)) {
            throw new BusinessException(ResultCode.EMAIL_CODE_ERROR);
        }
    }
}
