package com.god.thirdLine.controller.user;


import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.LoginDTO;
import com.god.thirdLine.domain.dto.RegisterDTO;
import com.god.thirdLine.domain.vo.LoginVO;
import com.god.thirdLine.service.EmailCodeService;
import com.god.thirdLine.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 用户表 前台公开控制器
 * </p>
 * 仅保留登录、注册与邮箱验证码接口（须匿名可访问以换取 token）；
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
    private final EmailCodeService emailCodeService;

    /**
     * 用户登录（放行，无需 token）；账号支持用户名或注册邮箱
     */
    @PostMapping("/login")
    public Result<LoginVO> login(@RequestBody LoginDTO dto) {
        return Result.success(userService.login(dto));
    }

    /**
     * 发送注册邮箱验证码（放行，60 秒内同一邮箱限发一次）
     */
    @PostMapping("/email/code")
    public Result<Void> sendEmailCode(@RequestParam("email") String email) {
        emailCodeService.sendCode(email == null ? "" : email.trim().toLowerCase());
        return Result.success(null);
    }

    /**
     * 用户注册（放行）：校验邮箱验证码后创建普通用户，成功即自动登录
     */
    @PostMapping("/register")
    public Result<LoginVO> register(@RequestBody RegisterDTO dto) {
        return Result.success(userService.register(dto));
    }
}
