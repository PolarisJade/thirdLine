package com.god.thirdLine.controller.user;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.vo.PortfolioVO;
import com.god.thirdLine.service.IPortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * <p>
 * 作品集表 前台公开控制器
 * </p>
 * 仅提供前台作品集所需的读接口，位于 /user/** 命名空间，不做登录校验；
 * 后台作品管理（分页/增删改）见 {@code /admin/portfolio}。
 *
 * @author ParlisJade
 * @since 2026-09-24
 */
@RestController
@RequestMapping("/user/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final IPortfolioService portfolioService;

    /**
     * 查询全部已发布作品，按发布时间倒序（前台作品集展示，读操作放行）
     */
    @GetMapping("/list")
    public Result<List<PortfolioVO>> list() {
        return Result.success(portfolioService.listPublishedPortfolios());
    }
}
