package com.god.thirdLine.controller.user;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.vo.SiteStatsVO;
import com.god.thirdLine.service.ISiteStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 网站基本信息 前台公开控制器
 *
 * @author ParlisJade
 */
@RestController
@RequestMapping("/user/site")
@RequiredArgsConstructor
public class SiteStatsController {

    private final ISiteStatsService siteStatsService;

    /**
     * 网站基本信息统计：文章总数 / 分类总数 / 标签总数（读操作，放行）
     */
    @GetMapping("/stats")
    public Result<SiteStatsVO> stats() {
        return Result.success(siteStatsService.getSiteStats());
    }
}