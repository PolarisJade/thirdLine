package com.god.thirdLine.service;

import com.god.thirdLine.domain.dto.ChatDTO;
import com.god.thirdLine.domain.vo.ChatReplyVO;

/**
 * <p>
 * 页面人物 AI 对话 服务类
 * </p>
 * 单轮无记忆：每次请求只把当前这一句话交给模型，不保存、不读取任何历史上下文。
 *
 * @author ParlisJade
 * @since 2026-10-16
 */
public interface IChatService {

    /**
     * 与页面人物对话：输入输出双向敏感词过滤，模型超时 / 报错时返回兜底台词
     *
     * @param dto 用户发送的内容
     * @return 角色回复（含是否兜底标记）
     */
    ChatReplyVO chat(ChatDTO dto);
}
