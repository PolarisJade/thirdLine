package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.context.UserContext;
import com.god.thirdLine.domain.dto.PasswordUpdateDTO;
import com.god.thirdLine.domain.dto.UserUpdateDTO;
import com.god.thirdLine.domain.vo.UserVO;
import com.god.thirdLine.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 用户表 后台管理控制器
 * </p>
 * 位于 /admin/** 命名空间，须登录方可操作；登录接口仍保留在公开的 /user/user/login。
 *
 * @author ParlisJade
 * @since 2026-09-21
 */
@RestController
@RequestMapping("/admin/user")
@RequiredArgsConstructor
public class AdminUserController {

    private final IUserService userService;

    /**
     * 修改当前登录用户信息
     */
    @PutMapping("/info")
    public Result<UserVO> updateInfo(@RequestBody UserUpdateDTO dto) {
        return Result.success(userService.updateUser(UserContext.getUserId(), dto));
    }

    /**
     * 修改当前登录用户密码
     */
    @PutMapping("/password")
    public Result<Void> updatePassword(@RequestBody PasswordUpdateDTO dto) {
        userService.updatePassword(UserContext.getUserId(), dto);
        return Result.success();
    }
}
