package com.god.thirdLine.controller.user;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.vo.TechStackVO;
import com.god.thirdLine.service.ITechStackService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * <p>
 * 技术栈字典 前台公开控制器
 * </p>
 * 仅提供前台展示与筛选所需的读接口（只返回启用中的技术栈），位于 /user/** 命名空间，不做登录校验；
 * 后台管理相关读写见 {@code /admin/tech-stack}。
 *
 * @author ParlisJade
 * @since 2026-10-12
 */
@RestController
@RequestMapping("/user/tech-stack")
@RequiredArgsConstructor
public class TechStackController {

    private final ITechStackService techStackService;

    /**
     * 查询启用中的技术栈（读操作，放行）
     */
    @GetMapping("/list")
    public Result<List<TechStackVO>> list() {
        return Result.success(techStackService.listEnabledTechStacks());
    }
}
