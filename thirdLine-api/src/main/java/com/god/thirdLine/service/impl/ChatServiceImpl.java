package com.god.thirdLine.service.impl;

import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.config.ChatProperties;
import com.god.thirdLine.domain.dto.ChatDTO;
import com.god.thirdLine.domain.vo.ChatReplyVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.service.IChatService;
import com.god.thirdLine.service.SensitiveWordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.regex.Pattern;

/**
 * <p>
 * 页面人物 AI 对话 服务实现类
 * </p>
 * 处理链路：参数校验 -> 输入敏感词 -> 调模型（带超时看门狗）-> 输出敏感词 -> 正常返回。
 * 任何一步失败都不会把异常抛给前端，而是换成角色口吻的固定台词，保证页面永远有话说。
 *
 * @author ParlisJade
 * @since 2026-10-16
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements IChatService {

    /** 兜底台词列表为空时使用的最后一句，避免配置缺失导致返回空串 */
    private static final String DEFAULT_FALLBACK_REPLY = "唔……我刚刚走神了，再说一遍好不好？";

    /** 模型偶尔会自带「祢豆子：」这类角色名前缀，展示前去掉 */
    private static final Pattern ROLE_PREFIX = Pattern.compile("^\\s*(祢豆子|角色|助手|AI)\\s*[:：]\\s*", Pattern.CASE_INSENSITIVE);

    /** 持有系统提示词（人物设定）的对话客户端，由 ChatClientConfig 构建，无任何记忆 advisor */
    private final ChatClient chatClient;

    private final SensitiveWordService sensitiveWordService;
    private final ChatProperties chatProperties;

    /** 对话专用线程池，见 ChatClientConfig#chatExecutor */
    private final ThreadPoolTaskExecutor chatExecutor;

    @Override
    public ChatReplyVO chat(ChatDTO dto) {
        // 1. 参数校验
        String message = dto == null || dto.getMessage() == null ? "" : dto.getMessage().trim();
        if (!StringUtils.hasText(message)) {
            throw new BusinessException(ResultCode.CHAT_MESSAGE_EMPTY);
        }
        if (message.length() > chatProperties.getMaxInputLength()) {
            throw new BusinessException(ResultCode.CHAT_MESSAGE_TOO_LONG,
                    "一句话最多 " + chatProperties.getMaxInputLength() + " 个字，说短一点吧");
        }

        // 2. 输入敏感词：不浪费一次模型调用，直接用角色口吻带过（也不提示具体命中了什么）
        if (sensitiveWordService.contains(message)) {
            log.info("人物对话输入命中敏感词，已拦截：length={}", message.length());
            return ChatReplyVO.fallback(chatProperties.getSensitiveReply());
        }

        // 3. 调模型（单轮无记忆，带超时看门狗）
        String reply = askModel(message);

        // 4. 超时 / 上游报错 / 空回复：返回兜底台词
        if (!StringUtils.hasText(reply)) {
            return ChatReplyVO.fallback(randomFallbackReply());
        }

        // 5. 输出敏感词：模型说的话也要过滤，整句替换成拦截台词
        if (sensitiveWordService.contains(reply)) {
            log.info("人物对话输出命中敏感词，已替换为拦截台词：length={}", reply.length());
            return ChatReplyVO.fallback(chatProperties.getSensitiveReply());
        }

        return ChatReplyVO.of(reply);
    }

    /**
     * 在专用线程池里同步调用模型，并用 {@code tl.chat.timeout-ms} 兜住长时间无响应。
     * <p>
     * 超时后不再等待，直接把这次调用判为失败并返回兜底台词；被放弃的后台线程会自然结束，
     * 不会阻塞后续请求（免费额度下偶发几十秒无响应，不能让它拖住用户）。
     *
     * @return 归一化后的模型回复；超时或失败返回 null
     */
    private String askModel(String message) {
        Future<String> future;
        try {
            future = chatExecutor.submit(() -> chatClient.prompt().user(message).call().content());
        } catch (TaskRejectedException e) {
            log.warn("人物对话线程池已满，直接返回兜底台词");
            return null;
        }

        try {
            return normalize(future.get(chatProperties.getTimeoutMs(), TimeUnit.MILLISECONDS));
        } catch (TimeoutException e) {
            future.cancel(true);
            log.warn("人物对话超时（{}ms），返回兜底台词", chatProperties.getTimeoutMs());
            return null;
        } catch (InterruptedException e) {
            future.cancel(true);
            // 恢复中断标记，避免吞掉线程的中断状态
            Thread.currentThread().interrupt();
            log.warn("人物对话被中断，返回兜底台词");
            return null;
        } catch (ExecutionException e) {
            Throwable cause = e.getCause() == null ? e : e.getCause();
            log.warn("人物对话调用失败，返回兜底台词：{}", cause.toString());
            return null;
        }
    }

    /**
     * 归一化模型输出：去掉角色名前缀、把换行和连续空白压成一个空格，保证气泡里就是一行短句
     *
     * @return 归一化后的文本；空内容返回 null（交给兜底台词）
     */
    private String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        String text = ROLE_PREFIX.matcher(raw).replaceFirst("").replaceAll("\\s+", " ").trim();
        return text.isEmpty() ? null : text;
    }

    /**
     * 随机取一条兜底台词，避免每次卡顿都回同一句
     */
    private String randomFallbackReply() {
        List<String> replies = chatProperties.getFallbackReplies();
        if (replies == null || replies.isEmpty()) {
            return DEFAULT_FALLBACK_REPLY;
        }
        return replies.get(ThreadLocalRandom.current().nextInt(replies.size()));
    }
}
