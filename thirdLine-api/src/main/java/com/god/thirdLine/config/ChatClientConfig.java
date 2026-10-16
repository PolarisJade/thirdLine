package com.god.thirdLine.config;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ThreadPoolExecutor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.util.StreamUtils;

/**
 * ChatClient 配置：基于 Spring AI 自动装配的 ChatClient.Builder 构建对话客户端。
 * 系统提示词单独存放在 txt 文件中，创建客户端时读取其内容作为默认系统提示。
 * 模型、密钥、端点等仍来自 application.yml 的 spring.ai.openai.* 配置。
 * <p>
 * 注意：这里刻意不注册任何 ChatMemory advisor —— 页面人物是单轮对话，
 * 不需要（也不应该）在服务端累积会话历史。
 *
 * @author ParlisJade
 */
@Configuration
public class ChatClientConfig {

    /** 系统提示词文件位置（classpath 下） */
    @Value("classpath:prompts/system-prompt.txt")
    private Resource systemPromptResource;

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) throws IOException {
        String systemPrompt;
        try (InputStream in = systemPromptResource.getInputStream()) {
            // 用 UTF-8 读取，避免中文提示词乱码；trim 去掉首尾多余空白与换行
            systemPrompt = StreamUtils.copyToString(in, StandardCharsets.UTF_8).trim();
        } catch (IOException e) {
            throw new UncheckedIOException("读取系统提示词文件失败：" + systemPromptResource, e);
        }
        return builder
                .defaultSystem(systemPrompt)
                .build();
    }

    /**
     * 对话专用线程池。
     * <p>
     * 模型调用是阻塞 IO，且免费额度下偶发长时间无响应，所以放到独立线程里执行，
     * 由 {@code ChatServiceImpl} 用超时读取（看门狗）决定是否放弃本次调用并返回兜底台词，
     * 避免拖住 Tomcat 请求线程。
     * <p>
     * 池上限同时充当对上游模型的并发上限；队列满时由调用线程执行（CallerRuns），
     * 形成背压而不是直接丢请求。
     */
    @Bean
    public ThreadPoolTaskExecutor chatExecutor(ChatProperties chatProperties) {
        int max = Math.max(1, chatProperties.getMaxConcurrent());
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(max);
        executor.setMaxPoolSize(max);
        executor.setQueueCapacity(max * 8);
        executor.setThreadNamePrefix("chat-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
