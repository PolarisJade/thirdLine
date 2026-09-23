package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 修改密码请求参数（用户ID取自登录态）
 *
 * @author ParlisJade
 */
@Data
public class PasswordUpdateDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 旧密码（明文） */
    private String oldPassword;

    /** 新密码（明文） */
    private String newPassword;
}
