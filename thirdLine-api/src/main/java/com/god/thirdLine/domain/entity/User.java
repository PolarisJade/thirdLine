package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;

import java.io.Serial;
import java.time.LocalDateTime;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * <p>
 * 用户表
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_user")
public class User implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 角色：站点管理员（可访问 /admin/**） */
    public static final Integer ROLE_ADMIN = 0;

    /** 角色：普通注册用户 */
    public static final Integer ROLE_USER = 1;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 登录用户名
     */
    private String username;

    /**
     * BCrypt加密密码
     */
    private String password;

    /**
     * 展示昵称
     */
    private String nickname;

    /**
     * 头像URL
     */
    private String avatar;

    /**
     * 联系邮箱
     */
    private String email;

    /**
     * 状态：0禁用/1正常
     */
    private Integer status;

    /**
     * 角色：0管理员 / 1普通用户
     */
    private Integer role;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;


}
