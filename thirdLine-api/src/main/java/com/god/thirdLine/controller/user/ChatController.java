package com.god.thirdLine.controller.user;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.ChatDTO;
import com.god.thirdLine.domain.vo.ChatReplyVO;
import com.god.thirdLine.service.IChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 页面人物 AI 对话 前台控制器
 * </p>
 * 免登录：{@code /user/**} 未注册登录拦截器，游客可直接对话。
 * 单轮无记忆，服务端不保存任何聊天内容；超时、报错、命中敏感词都由服务层换成固定台词返回。
 *
 * @author ParlisJade
 * @since 2026-10-16
 */
@RestController
@RequestMapping("/user/chat")
@RequiredArgsConstructor
public class ChatController {

    private final IChatService chatService;

    /**
     * 和页面人物说一句话（免登录，单轮无记忆）
     *
     * @param dto 用户发送的内容
     * @return 角色回复，含是否兜底台词标记
     */
    @PostMapping
    public Result<ChatReplyVO> chat(@RequestBody ChatDTO dto) {
        return Result.success(chatService.chat(dto));
    }
}
