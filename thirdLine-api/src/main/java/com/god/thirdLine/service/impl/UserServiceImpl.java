package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.LoginDTO;
import com.god.thirdLine.domain.dto.PasswordUpdateDTO;
import com.god.thirdLine.domain.dto.UserUpdateDTO;
import com.god.thirdLine.domain.entity.User;
import com.god.thirdLine.domain.vo.LoginVO;
import com.god.thirdLine.domain.vo.UserVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.UserMapper;
import com.god.thirdLine.service.IUserService;
import com.god.thirdLine.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

/**
 * <p>
 * 用户表 服务实现类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements IUserService {

    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public LoginVO login(LoginDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getUsername()) || !StringUtils.hasText(dto.getPassword())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "用户名和密码不能为空");
        }

        // 根据账号查询用户，查不到直接抛出自定义异常
        User user = this.getOne(Wrappers.<User>lambdaQuery()
                .eq(User::getUsername, dto.getUsername()), false);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 密码校验
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.PASSWORD_ERROR);
        }

        // 状态校验：0 禁用
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException(ResultCode.USER_DISABLED);
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        LoginVO loginVO = new LoginVO();
        loginVO.setToken(token);
        loginVO.setUserInfo(toVO(user));
        return loginVO;
    }

    @Override
    public UserVO updateUser(Long userId, UserUpdateDTO dto) {
        User user = this.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        if (dto == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "修改内容不能为空");
        }

        // 仅更新传入的字段
        if (dto.getNickname() != null) {
            user.setNickname(dto.getNickname());
        }
        if (dto.getAvatar() != null) {
            user.setAvatar(dto.getAvatar());
        }
        if (dto.getEmail() != null) {
            user.setEmail(dto.getEmail());
        }
        user.setUpdateTime(LocalDateTime.now());
        this.updateById(user);
        return toVO(user);
    }

    @Override
    public void updatePassword(Long userId, PasswordUpdateDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getOldPassword()) || !StringUtils.hasText(dto.getNewPassword())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "旧密码和新密码不能为空");
        }

        // 1. 先判断新旧密码是否一致
        if (dto.getOldPassword().equals(dto.getNewPassword())) {
            throw new BusinessException(ResultCode.SAME_PASSWORD);
        }

        // 2. 查询用户
        User user = this.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 3. 校验旧密码与数据库是否一致
        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.OLD_PASSWORD_ERROR);
        }

        // 4. 一致则修改密码
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        user.setUpdateTime(LocalDateTime.now());
        this.updateById(user);
    }

    private UserVO toVO(User user) {
        UserVO vo = new UserVO();
        BeanUtils.copyProperties(user, vo);
        return vo;
    }
}
