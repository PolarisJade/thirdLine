package com.god.thirdLine.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 页面人物 AI 对话配置，对应 application.yml 中 tl.chat.* 配置项。
 * <p>
 * 兜底台词与敏感词台词都放在配置里，改文案不需要动代码。
 *
 * @author ParlisJade
 */
@Data
@Component
@ConfigurationProperties(prefix = "tl.chat")
public class ChatProperties {

    /** 单次模型调用超时时间（毫秒），超时立即返回兜底台词（Agnes 免费额度偶发长时间无响应） */
    private long timeoutMs = 30_000L;

    /** 用户单条消息最大字符数，超出直接拒绝 */
    private int maxInputLength = 200;

    /** 同时进行的对话数上限，同时也是对上游模型的并发上限，避免触发免费额度 RPM 限流 */
    private int maxConcurrent = 4;

    /** 模型超时 / 报错 / 返回空时随机返回的兜底台词 */
    private List<String> fallbackReplies = List.of("唔……我刚刚走神了，再说一遍好不好？");

    /** 命中敏感词（输入或输出）时返回的台词 */
    private String sensitiveReply = "唔……这个我不想聊，我们说点别的吧？";
}
