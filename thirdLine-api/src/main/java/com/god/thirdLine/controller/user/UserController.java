package com.god.thirdLine.controller.user;


import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.LoginDTO;
import com.god.thirdLine.domain.vo.LoginVO;
import com.god.thirdLine.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 用户表 前台公开控制器
 * </p>
 * 仅保留登录接口（须匿名可访问以换取 token）；
 * 资料 / 密码修改等需登录的操作见 {@code /admin/user}。
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
@RestController
@RequestMapping("/user/user")
@RequiredArgsConstructor
public class UserController {

    private final IUserService userService;

    /**
     * 用户登录（放行，无需 token）
     */
    @PostMapping("/login")
    public Result<LoginVO> login(@RequestBody LoginDTO dto) {
        return Result.success(userService.login(dto));
    }
}
