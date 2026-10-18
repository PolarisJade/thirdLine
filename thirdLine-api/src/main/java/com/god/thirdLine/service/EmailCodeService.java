package com.god.thirdLine.service;

import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * 注册邮箱验证码服务：生成并发送验证码、限频、校验。
 * <p>
 * 验证码保存在本机内存（博客为单实例应用，无需引入 Redis），
 * 每条记录携带过期时间与上次发送时间，过期后自动失效。
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

    /** 邮箱 -> 验证码记录 */
    private final Map<String, CodeEntry> cache = new ConcurrentHashMap<>();

    private final MailService mailService;

    @Value("${email-code.subject:【thirdLine】邮箱验证码}")
    private String subject;

    @Value("${email-code.expire-minutes:10}")
    private long expireMinutes;

    @Value("${email-code.send-interval-seconds:60}")
    private long sendIntervalSeconds;

    public EmailCodeService(MailService mailService) {
        this.mailService = mailService;
    }

    /**
     * 向邮箱发送 6 位数字验证码；同一邮箱在限频窗口内不可重复发送。
     * <p>
     * 验证码会先写入内存缓存，再把邮件任务提交到线程池，因此接口返回时
     * 邮件可能还在发送中，但用户收到邮件后立即提交注册一定可以通过校验。
     */
    public void sendCode(String email) {
        if (email == null || email.isBlank() || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "邮箱格式不正确");
        }
        if (!mailService.isConfigured()) {
            throw new BusinessException(ResultCode.EMAIL_SEND_FAILED, "邮件服务未配置，请先在 application.yml 填写 spring.mail 信息");
        }
        long now = System.currentTimeMillis();
        cleanExpired(now);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        CodeEntry entry = new CodeEntry(code, now + expireMinutes * 60_000, now);
        // 用 compute 原子地完成「限频检查 + 写入缓存」，避免同一邮箱并发点击时发出两封
        cache.compute(email, (key, last) -> {
            if (last != null && now - last.sentAt < sendIntervalSeconds * 1000) {
                throw new BusinessException(ResultCode.EMAIL_CODE_SEND_TOO_FREQUENT);
            }
            return entry;
        });

        // 异步发送，不阻塞当前请求线程；SMTP 失败只在后台记录日志，提交失败则提示用户重试
        boolean queued = mailService.sendAsync(email, subject,
                "您的验证码是：" + code + "，" + expireMinutes + " 分钟内有效。\n"
                        + "若非本人操作，请忽略本邮件。");
        if (!queued) {
            // 线程池已满等提交失败：撤销刚写入的验证码，让用户可以立即重试
            cache.remove(email, entry);
            throw new BusinessException(ResultCode.EMAIL_SEND_FAILED);
        }
    }

    /**
     * 校验验证码；校验通过后立即移除，防止重用
     */
    public void verifyCode(String email, String code) {
        CodeEntry entry = cache.get(email);
        if (entry == null || System.currentTimeMillis() > entry.expireAt
                || !entry.code.equals(code)) {
            throw new BusinessException(ResultCode.EMAIL_CODE_ERROR);
        }
        cache.remove(email);
    }

    private void cleanExpired(long now) {
        cache.entrySet().removeIf(e -> now > e.getValue().expireAt);
    }

    /** 验证码缓存条目 */
    private record CodeEntry(String code, long expireAt, long sentAt) {
    }
}
