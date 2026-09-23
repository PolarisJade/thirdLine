package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 登录成功返回对象
 *
 * @author ParlisJade
 */
@Data
public class LoginVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** JWT 令牌，后续请求放入 Authorization 头，格式：Bearer {token} */
    private String token;

    /** 登录用户信息 */
    private UserVO userInfo;
}
