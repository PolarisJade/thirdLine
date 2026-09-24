package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户展示对象（不含密码等敏感字段）
 *
 * @author ParlisJade
 */
@Data
public class UserVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    private String username;

    private String nickname;

    private String avatar;

    private String email;

    private Integer status;

    /** 角色：0管理员 / 1普通用户 */
    private Integer role;

    private LocalDateTime createTime;
}
