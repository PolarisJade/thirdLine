package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.query.DanmakuQuery;
import com.god.thirdLine.domain.vo.DanmakuReportVO;
import com.god.thirdLine.domain.vo.DanmakuVO;
import com.god.thirdLine.service.IDanmakuService;
import com.god.thirdLine.service.ISiteConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 弹幕 后台管理控制器
 * </p>
 * 位于 /admin/** 命名空间，读写均经 JWT 拦截器校验管理员登录。
 * 提供弹幕分页、显隐切换、删除、举报列表与处理，以及全局弹幕开关。
 *
 * @author ParlisJade
 * @since 2026-09-27
 */
@RestController
@RequestMapping("/admin/danmaku")
@RequiredArgsConstructor
public class AdminDanmakuController {

    private final IDanmakuService danmakuService;
    private final ISiteConfigService siteConfigService;

    /**
     * 分页查询弹幕（可按状态过滤，含累计举报数）
     */
    @GetMapping("/page")
    public Result<PageResult<DanmakuVO>> page(DanmakuQuery query) {
        return Result.success(danmakuService.pageDanmaku(query));
    }

    /**
     * 切换弹幕显隐：0隐藏 / 1显示
     */
    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        danmakuService.updateStatus(id, status);
        return Result.success();
    }

    /**
     * 删除弹幕（连带删除其举报记录）
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        danmakuService.deleteDanmaku(id);
        return Result.success();
    }

    /**
     * 分页查询举报记录（可按处理状态过滤）
     */
    @GetMapping("/report/page")
    public Result<PageResult<DanmakuReportVO>> pageReports(@RequestParam(required = false) Integer status,
                                                            @RequestParam(defaultValue = "1") Integer page,
                                                            @RequestParam(defaultValue = "12") Integer size) {
        return Result.success(danmakuService.pageReports(status, page, size));
    }

    /**
     * 将某条举报标记为已处理
     */
    @PutMapping("/report/{id}/handle")
    public Result<Void> handleReport(@PathVariable Long id) {
        danmakuService.handleReport(id);
        return Result.success();
    }

    /**
     * 查询弹幕全局开关状态
     */
    @GetMapping("/switch")
    public Result<Boolean> getSwitch() {
        return Result.success(siteConfigService.isDanmakuEnabled());
    }

    /**
     * 设置弹幕全局开关：true开启 / false关闭，关闭后前台不再展示弹幕
     */
    @PutMapping("/switch")
    public Result<Void> setSwitch(@RequestParam Boolean enabled) {
        siteConfigService.setDanmakuEnabled(Boolean.TRUE.equals(enabled));
        return Result.success();
    }
}
