package com.god.thirdLine.service;

import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 注册邮箱验证码服务：生成并发送验证码、限频、校验。
 * <p>
 * 验证码保存在本机内存（博客为单实例应用，无需引入 Redis），
 * 每条记录携带过期时间与上次发送时间，过期后自动失效。
 *
 * @author ParlisJade
 */
@Slf4j
@Service
public class EmailCodeService {

    private static final SecureRandom RANDOM = new SecureRandom();

    /** 邮箱 -> 验证码记录 */
    private final Map<String, CodeEntry> cache = new ConcurrentHashMap<>();

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String from;

    @Value("${email-code.subject:【thirdLine】邮箱验证码}")
    private String subject;

    @Value("${email-code.expire-minutes:10}")
    private long expireMinutes;

    @Value("${email-code.send-interval-seconds:60}")
    private long sendIntervalSeconds;

    public EmailCodeService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * 向邮箱发送 6 位数字验证码；同一邮箱在限频窗口内不可重复发送
     */
    public void sendCode(String email) {
        if (!StringUtils.hasText(from)) {
            throw new BusinessException(ResultCode.EMAIL_SEND_FAILED, "邮件服务未配置，请先在 application.yml 填写 spring.mail 信息");
        }
        long now = System.currentTimeMillis();
        cleanExpired(now);

        CodeEntry last = cache.get(email);
        if (last != null && now - last.sentAt < sendIntervalSeconds * 1000) {
            throw new BusinessException(ResultCode.EMAIL_CODE_SEND_TOO_FREQUENT);
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(email);
            message.setSubject(subject);
            message.setText("您的验证码是：" + code + "，" + expireMinutes + " 分钟内有效。\n"
                    + "若非本人操作，请忽略本邮件。");
            mailSender.send(message);
        } catch (MailException e) {
            log.error("发送验证邮件失败, to={}", email, e);
            throw new BusinessException(ResultCode.EMAIL_SEND_FAILED);
        }
        cache.put(email, new CodeEntry(code, now + expireMinutes * 60_000, now));
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
