package com.god.thirdLine.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.god.thirdLine.domain.dto.LoginDTO;
import com.god.thirdLine.domain.dto.PasswordUpdateDTO;
import com.god.thirdLine.domain.dto.RegisterDTO;
import com.god.thirdLine.domain.dto.UserUpdateDTO;
import com.god.thirdLine.domain.entity.User;
import com.god.thirdLine.domain.vo.LoginVO;
import com.god.thirdLine.domain.vo.UserVO;

/**
 * <p>
 * 用户表 服务类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
public interface IUserService extends IService<User> {

    /**
     * 用户登录：根据用户名或邮箱查询用户并校验密码，成功后签发 JWT
     *
     * @param dto 登录参数
     * @return 令牌与用户信息
     */
    LoginVO login(LoginDTO dto);

    /**
     * 用户注册：校验邮箱验证码后创建普通用户，成功即自动登录
     *
     * @param dto 注册参数
     * @return 令牌与用户信息
     */
    LoginVO register(RegisterDTO dto);

    /**
     * 修改用户信息
     *
     * @param userId 当前登录用户ID
     * @param dto    待修改信息
     * @return 修改后的用户信息
     */
    UserVO updateUser(Long userId, UserUpdateDTO dto);

    /**
     * 修改密码
     *
     * @param userId 当前登录用户ID
     * @param dto    新旧密码
     */
    void updatePassword(Long userId, PasswordUpdateDTO dto);
}
