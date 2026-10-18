package com.god.thirdLine.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 异步邮件发送服务。
 * <p>
 * 所有邮件都提交到 {@code mailExecutor} 线程池后立即返回，调用方（注册验证码接口、
 * 友链审核接口）不会被 SMTP 的网络耗时拖住。SMTP 发送失败只记录日志；
 * 线程池满时 {@link #sendAsync} 返回 false，由调用方决定是否提示用户，
 * 但不会退回到请求线程同步发送。
 *
 * @author ParlisJade
 * @since 2026-10-18
 */
@Slf4j
@Service
public class MailService {

    private final JavaMailSender mailSender;
    private final ThreadPoolTaskExecutor mailExecutor;
    private final String from;
    private final String friendLinkApprovedSubject;
    private final String friendLinkRejectedSubject;

    public MailService(JavaMailSender mailSender,
                       @Qualifier("mailExecutor") ThreadPoolTaskExecutor mailExecutor,
                       @Value("${spring.mail.username:}") String from,
                       @Value("${email-code.friend-link-approved-subject:【thirdLine】友链申请已通过}")
                       String friendLinkApprovedSubject,
                       @Value("${email-code.friend-link-rejected-subject:【thirdLine】友链申请未通过}")
                       String friendLinkRejectedSubject) {
        this.mailSender = mailSender;
        this.mailExecutor = mailExecutor;
        this.from = from;
        this.friendLinkApprovedSubject = friendLinkApprovedSubject;
        this.friendLinkRejectedSubject = friendLinkRejectedSubject;
    }

    /**
     * 邮件服务是否配置了发件邮箱。注册验证码接口用它做前置校验，
     * 没配置时直接给出明确提示，而不是把任务丢进线程池后才失败。
     */
    public boolean isConfigured() {
        return StringUtils.hasText(from);
    }

    /**
     * 异步发送一封纯文本邮件。
     * <p>
     * 方法只负责把任务提交到线程池；真正的 SMTP 调用在 {@code mail-*} 线程里执行。
     *
     * @return 任务是否成功进入线程池；未配置、收件人为空或队列已满时返回 false
     */
    public boolean sendAsync(String to, String subject, String text) {
        if (!isConfigured()) {
            log.error("邮件服务未配置 spring.mail.username，跳过发送: to={}, subject={}", to, subject);
            return false;
        }
        if (!StringUtils.hasText(to)) {
            log.warn("收件人为空，跳过发送: subject={}", subject);
            return false;
        }

        try {
            mailExecutor.execute(() -> doSend(to, subject, text));
            return true;
        } catch (TaskRejectedException e) {
            // 队列满：宁可丢这一封并留下日志，也不要退回到调用线程同步发送
            log.error("邮件线程池已满，本次邮件被丢弃: to={}, subject={}", to, subject);
            return false;
        }
    }

    /**
     * 友链申请审核通过通知。
     *
     * @param to       申请人邮箱
     * @param siteName 申请人站点名称
     * @param siteUrl  申请人站点地址
     */
    public void sendFriendLinkApproved(String to, String siteName, String siteUrl) {
        String text = "你好，\n\n"
                + "你提交的友链申请已通过审核，站点已经展示在本站友链页。\n\n"
                + "站点名称：" + (StringUtils.hasText(siteName) ? siteName : "（未填写）") + "\n"
                + "站点地址：" + (StringUtils.hasText(siteUrl) ? siteUrl : "（未填写）") + "\n\n"
                + "感谢交换友链，欢迎常来。\n"
                + "—— thirdLine";
        sendAsync(to, friendLinkApprovedSubject, text);
    }

    /**
     * 友链申请审核未通过通知，正文带上管理员在前端填写的拒绝原因。
     *
     * @param to           申请人邮箱
     * @param siteName     申请人站点名称
     * @param siteUrl      申请人站点地址
     * @param rejectReason 管理员填写的拒绝原因
     */
    public void sendFriendLinkRejected(String to, String siteName, String siteUrl, String rejectReason) {
        String text = "你好，\n\n"
                + "很抱歉，你提交的友链申请未通过审核。\n\n"
                + "站点名称：" + (StringUtils.hasText(siteName) ? siteName : "（未填写）") + "\n"
                + "站点地址：" + (StringUtils.hasText(siteUrl) ? siteUrl : "（未填写）") + "\n"
                + "拒绝原因：" + (StringUtils.hasText(rejectReason) ? rejectReason : "（未填写）") + "\n\n"
                + "如果情况有变化，欢迎修改后重新提交申请。\n"
                + "—— thirdLine";
        sendAsync(to, friendLinkRejectedSubject, text);
    }

    /**
     * 在线程池线程中真正执行 SMTP 发送。任何异常都在这里消化，避免线程池任务异常终止。
     */
    private void doSend(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("邮件发送成功: to={}, subject={}", to, subject);
        } catch (Exception e) {
            log.error("邮件发送失败: to={}, subject={}", to, subject, e);
        }
    }
}
