package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.LoginDTO;
import com.god.thirdLine.domain.dto.PasswordUpdateDTO;
import com.god.thirdLine.domain.dto.RegisterDTO;
import com.god.thirdLine.domain.dto.UserUpdateDTO;
import com.god.thirdLine.domain.entity.User;
import com.god.thirdLine.domain.vo.LoginVO;
import com.god.thirdLine.domain.vo.UserVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.UserMapper;
import com.god.thirdLine.service.EmailCodeService;
import com.god.thirdLine.service.IUserService;
import com.god.thirdLine.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

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

    /** 邮箱格式校验 */
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$");

    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailCodeService emailCodeService;

    @Override
    public LoginVO login(LoginDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getUsername()) || !StringUtils.hasText(dto.getPassword())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "用户名和密码不能为空");
        }

        // 支持用户名或注册邮箱两种账号形式登录，查不到直接抛出自定义异常
        String account = dto.getUsername().trim();
        User user = this.getOne(Wrappers.<User>lambdaQuery()
                .and(w -> w.eq(User::getUsername, account).or().eq(User::getEmail, account)), false);
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

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
        LoginVO loginVO = new LoginVO();
        loginVO.setToken(token);
        loginVO.setUserInfo(toVO(user));
        return loginVO;
    }

    @Override
    public LoginVO register(RegisterDTO dto) {
        // 1. 基础参数校验
        if (dto == null || !StringUtils.hasText(dto.getEmail()) || !StringUtils.hasText(dto.getCode())
                || !StringUtils.hasText(dto.getUsername()) || !StringUtils.hasText(dto.getPassword())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "邮箱、验证码、用户名和密码均不能为空");
        }
        String email = dto.getEmail().trim().toLowerCase();
        String username = dto.getUsername().trim();
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "邮箱格式不正确");
        }
        if (username.length() < 3 || username.length() > 20) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "用户名长度需在 3-20 个字符之间");
        }
        if (dto.getPassword().length() < 6) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "密码长度不能少于 6 位");
        }

        // 2. 校验邮箱验证码（一次性，通过后自动移除）
        emailCodeService.verifyCode(email, dto.getCode().trim());

        // 3. 邮箱、用户名唯一性校验
        if (this.exists(Wrappers.<User>lambdaQuery().eq(User::getEmail, email))) {
            throw new BusinessException(ResultCode.EMAIL_ALREADY_REGISTERED);
        }
        if (this.exists(Wrappers.<User>lambdaQuery().eq(User::getUsername, username))) {
            throw new BusinessException(ResultCode.USERNAME_ALREADY_EXISTS);
        }

        // 4. 落库：普通用户角色，昵称缺省取用户名
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setEmail(email);
        user.setNickname(StringUtils.hasText(dto.getNickname()) ? dto.getNickname().trim() : username);
        user.setRole(User.ROLE_USER);
        user.setStatus(1);
        user.setCreateTime(LocalDateTime.now());
        this.save(user);

        // 5. 注册成功即自动登录
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
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
