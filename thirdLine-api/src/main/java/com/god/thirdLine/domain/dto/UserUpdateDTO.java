package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 修改用户信息请求参数（用户ID取自登录态）
 *
 * @author ParlisJade
 */
@Data
public class UserUpdateDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 展示昵称 */
    private String nickname;

    /** 头像URL */
    private String avatar;

    /** 联系邮箱 */
    private String email;
}
