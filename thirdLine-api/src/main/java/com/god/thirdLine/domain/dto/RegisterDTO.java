package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 用户注册请求参数（邮箱验证码注册）
 *
 * @author ParlisJade
 */
@Data
public class RegisterDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 注册邮箱（接收验证码，注册后作为账号资料保存） */
    private String email;

    /** 邮箱验证码 */
    private String code;

    /** 登录用户名 */
    private String username;

    /** 明文密码 */
    private String password;

    /** 展示昵称，缺省时取用户名 */
    private String nickname;
}
