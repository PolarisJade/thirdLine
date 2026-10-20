package com.god.thirdLine.controller.user;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.FriendLinkApplyDTO;
import com.god.thirdLine.domain.vo.FriendLinkVO;
import com.god.thirdLine.service.IFriendLinkService;
import com.god.thirdLine.config.JwtProperties;
import com.god.thirdLine.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * <p>
 * 友情链接 前台公开控制器
 * </p>
 * 位于 /user/** 命名空间，不注册 JWT 拦截器，游客可浏览与提交申请；
 * 申请接口额外做「可选登录」处理：带了有效 token 就记录申请用户ID，没带按游客受理。
 * 后台友链管理（分页/增删改/审核）见 {@code /admin/friend-link}。
 *
 * @author ParlisJade
 * @since 2026-10-17
 */
@RestController
@RequestMapping("/user/friend-link")
@RequiredArgsConstructor
public class FriendLinkController {

    private final IFriendLinkService friendLinkService;
    private final JwtUtil jwtUtil;
    private final JwtProperties jwtProperties;

    /**
     * 查询前台可见友链（审核通过且未被隐藏），按新增顺序倒序
     */
    @GetMapping("/list")
    public Result<List<FriendLinkVO>> list() {
        return Result.success(friendLinkService.listVisibleLinks());
    }

    /** 查询访客友链申请开关，供前台决定是否展示申请入口。 */
    @GetMapping("/apply-enabled")
    public Result<Boolean> applyEnabled() {
        return Result.success(friendLinkService.isApplyEnabled());
    }

    /**
     * 提交友链申请，落库后进入待审核队列
     */
    @PostMapping("/apply")
    public Result<Void> apply(@RequestBody FriendLinkApplyDTO dto, HttpServletRequest request) {
        // 公开接口：登录与否都能申请，登录了就记下申请人，便于后台联系
        Long applyUserId = jwtUtil.resolveUserIdOrNull(request.getHeader(jwtProperties.getHeader()));
        friendLinkService.apply(dto, applyUserId);
        return Result.success();
    }
}
