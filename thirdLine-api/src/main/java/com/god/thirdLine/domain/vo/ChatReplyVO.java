package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 页面人物对话回复对象
 *
 * @author ParlisJade
 */
@Data
public class ChatReplyVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 角色回复内容：纯文本一句话，前端直接塞进气泡 */
    private String content;

    /** true 表示这是兜底 / 拦截台词，不是模型实时生成的（前端可据此跳过打字机动画） */
    private boolean fallback;

    /**
     * 模型正常回复
     */
    public static ChatReplyVO of(String content) {
        ChatReplyVO vo = new ChatReplyVO();
        vo.setContent(content);
        vo.setFallback(false);
        return vo;
    }

    /**
     * 兜底 / 拦截台词（超时、上游报错、命中敏感词）
     */
    public static ChatReplyVO fallback(String content) {
        ChatReplyVO vo = new ChatReplyVO();
        vo.setContent(content);
        vo.setFallback(true);
        return vo;
    }
}
