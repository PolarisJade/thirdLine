package com.god.thirdLine.controller.user;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.context.UserContext;
import com.god.thirdLine.domain.dto.DanmakuReportDTO;
import com.god.thirdLine.domain.dto.DanmakuSendDTO;
import com.god.thirdLine.domain.vo.DanmakuPoolVO;
import com.god.thirdLine.domain.vo.DanmakuVO;
import com.god.thirdLine.service.IDanmakuService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 弹幕 前台控制器
 * </p>
 * 弹幕池读取匿名可访问；发送、举报经 {@code UserJwtInterceptor} 强制登录，
 * userId 从 {@link UserContext} 获取。
 *
 * @author ParlisJade
 * @since 2026-09-27
 */
@RestController
@RequestMapping("/user/danmaku")
@RequiredArgsConstructor
public class DanmakuController {

    private final IDanmakuService danmakuService;

    /**
     * 拉取弹幕池（含全局开关状态与最近可见弹幕），匿名可访问
     *
     * @param limit 最多返回条数，默认 50
     */
    @GetMapping("/pool")
    public Result<DanmakuPoolVO> pool(@RequestParam(defaultValue = "50") int limit) {
        return Result.success(danmakuService.getPool(limit));
    }

    /**
     * 发送弹幕（需登录）
     */
    @PostMapping("/send")
    public Result<DanmakuVO> send(@RequestBody DanmakuSendDTO dto) {
        return Result.success(danmakuService.send(UserContext.getUserId(), dto));
    }

    /**
     * 举报弹幕（需登录）
     */
    @PostMapping("/report")
    public Result<Void> report(@RequestBody DanmakuReportDTO dto) {
        danmakuService.report(UserContext.getUserId(), dto);
        return Result.success();
    }
}
