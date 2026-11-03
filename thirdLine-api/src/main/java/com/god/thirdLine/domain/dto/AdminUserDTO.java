package com.god.thirdLine.domain.dto;

import lombok.Data;

/** 后台用户新增、编辑参数；编辑时仅覆盖非 null 字段。 */
@Data
public class AdminUserDTO {
    private Long id;
    private String username;
    /** 仅新增时使用，已有账号通过独立接口重置密码。 */
    private String password;
    private String nickname;
    private String avatar;
    private String email;
    /** 0 管理员 / 1 普通用户。 */
    private Integer role;
    /** 0 禁用 / 1 正常。 */
    private Integer status;
}
