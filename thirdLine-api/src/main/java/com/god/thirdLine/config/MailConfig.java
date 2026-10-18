package com.god.thirdLine.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

/**
 * 邮件异步发送线程池。
 * <p>
 * SMTP 发送是阻塞 IO，遇到网络抖动或邮箱服务商限流时可能卡住几十秒，
 * 不能占用 Tomcat 请求线程，所以统一交给这个独立线程池执行。
 * <p>
 * 队列满时使用 {@link ThreadPoolExecutor.AbortPolicy} 直接拒绝，由
 * {@code MailService} 捕获并返回失败；刻意不使用 CallerRunsPolicy，
 * 避免池满后又把发送动作退回到调用线程（也就是 Web 请求线程）上执行。
 *
 * @author ParlisJade
 * @since 2026-10-18
 */
@Configuration
public class MailConfig {

    /**
     * 邮件发送专用线程池。
     * <p>
     * 参数都带默认值，可在 application.yml 的 {@code email-code.async.*} 下调整。
     */
    @Bean("mailExecutor")
    public ThreadPoolTaskExecutor mailExecutor(
            @Value("${email-code.async.core-pool-size:2}") int corePoolSize,
            @Value("${email-code.async.max-pool-size:4}") int maxPoolSize,
            @Value("${email-code.async.queue-capacity:200}") int queueCapacity,
            @Value("${email-code.async.keep-alive-seconds:60}") int keepAliveSeconds,
            @Value("${email-code.async.await-termination-seconds:30}") int awaitTerminationSeconds) {

        int core = Math.max(1, corePoolSize);
        int max = Math.max(core, maxPoolSize);

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(core);
        executor.setMaxPoolSize(max);
        executor.setQueueCapacity(Math.max(0, queueCapacity));
        executor.setKeepAliveSeconds(Math.max(0, keepAliveSeconds));
        executor.setThreadNamePrefix("mail-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());
        // 应用关闭时先把已排队的邮件发完，避免停机丢信；最多等配置的秒数
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(Math.max(1, awaitTerminationSeconds));
        executor.initialize();
        return executor;
    }
}
