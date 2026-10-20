package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.FriendLinkAuditDTO;
import com.god.thirdLine.domain.dto.FriendLinkDTO;
import com.god.thirdLine.domain.query.FriendLinkQuery;
import com.god.thirdLine.domain.vo.FriendLinkAdminVO;
import com.god.thirdLine.service.IFriendLinkService;
import com.god.thirdLine.service.ISiteConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 友情链接 后台管理控制器
 * </p>
 * 位于 /admin/** 命名空间，读写均经 JWT 拦截器校验管理员登录。
 * 提供友链分页、详情、增删改、审核与显隐切换。
 *
 * @author ParlisJade
 * @since 2026-10-17
 */
@RestController
@RequestMapping("/admin/friend-link")
@RequiredArgsConstructor
public class AdminFriendLinkController {

    private final IFriendLinkService friendLinkService;
    private final ISiteConfigService siteConfigService;

    /** 查询访客友链申请开关。 */
    @GetMapping("/apply-switch")
    public Result<Boolean> applySwitch() {
        return Result.success(siteConfigService.isFriendLinkApplyEnabled());
    }

    /** 设置访客友链申请开关。 */
    @PutMapping("/apply-switch")
    public Result<Void> updateApplySwitch(@RequestParam("enabled") boolean enabled) {
        siteConfigService.setFriendLinkApplyEnabled(enabled);
        return Result.success();
    }

    /**
     * 分页查询友链（可按审核状态 / 显示状态 / 来源 / 关键词过滤，待审核排最前）
     */
    @GetMapping("/page")
    public Result<PageResult<FriendLinkAdminVO>> page(FriendLinkQuery query) {
        return Result.success(friendLinkService.pageFriendLinks(query));
    }

    /**
     * 根据ID查询友链详情（编辑回填用，含申请人邮箱与内部备注）
     */
    @GetMapping("/{id}")
    public Result<FriendLinkAdminVO> detail(@PathVariable Long id) {
        return Result.success(friendLinkService.getFriendLinkDetail(id));
    }

    /**
     * 后台新增友链（直接置为已通过，立即前台可见）
     */
    @PostMapping
    public Result<Long> save(@RequestBody FriendLinkDTO dto) {
        return Result.success(friendLinkService.saveFriendLink(dto));
    }

    /**
     * 修改友链（字段为 null 表示不动原值，可空文本传空串表示清空）
     */
    @PutMapping
    public Result<Void> update(@RequestBody FriendLinkDTO dto) {
        friendLinkService.updateFriendLink(dto);
        return Result.success();
    }

    /**
     * 审核友链：1通过 / 2拒绝（拒绝需填原因）。
     * 通过或拒绝时，若为访客申请且申请人填了邮箱，后端会异步发送对应通知；
     * 拒绝通知会带上本次填写的拒绝原因。
     */
    @PutMapping("/{id}/audit")
    public Result<Void> audit(@PathVariable Long id, @RequestBody FriendLinkAuditDTO dto) {
        dto.setId(id);
        friendLinkService.audit(dto);
        return Result.success();
    }

    /**
     * 切换友链显示状态：0隐藏 / 1显示（审核通过后临时上下线）
     */
    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        friendLinkService.updateStatus(id, status);
        return Result.success();
    }

    /**
     * 删除友链
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        friendLinkService.deleteFriendLink(id);
        return Result.success();
    }
}
