package com.god.thirdLine.domain.dto;

import lombok.Data;

/** 管理员重置用户密码，不需要提供原密码。 */
@Data
public class AdminPasswordResetDTO {
    private String newPassword;
}
