package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.context.UserContext;
import com.god.thirdLine.domain.dto.AdminUserDTO;
import com.god.thirdLine.domain.entity.Article;
import com.god.thirdLine.domain.entity.FriendLink;
import com.god.thirdLine.domain.entity.User;
import com.god.thirdLine.domain.query.UserQuery;
import com.god.thirdLine.domain.vo.UserVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.ArticleMapper;
import com.god.thirdLine.mapper.FriendLinkMapper;
import com.god.thirdLine.mapper.UserMapper;
import com.god.thirdLine.service.IAdminUserService;
import com.god.thirdLine.service.IOssReferenceService;
import com.god.thirdLine.service.SiteStatsCache;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements IAdminUserService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$");

    private final UserMapper userMapper;
    private final ArticleMapper articleMapper;
    private final FriendLinkMapper friendLinkMapper;
    private final PasswordEncoder passwordEncoder;
    private final IOssReferenceService ossReferenceService;
    private final SiteStatsCache siteStatsCache;

    @Override
    public PageResult<UserVO> pageUsers(UserQuery query) {
        UserQuery params = query == null ? new UserQuery() : query;
        validateRoleAndStatus(params.getRole(), params.getStatus());
        String keyword = params.getKeyword() == null ? "" : params.getKeyword().trim();
        Page<User> page = userMapper.selectPage(new Page<>(params.getPage(), params.getSize()),
                Wrappers.<User>lambdaQuery()
                        .select(User::getId, User::getUsername, User::getNickname, User::getAvatar,
                                User::getEmail, User::getRole, User::getStatus, User::getCreateTime)
                        .and(!keyword.isEmpty(), w -> w.like(User::getUsername, keyword)
                                .or().like(User::getNickname, keyword).or().like(User::getEmail, keyword))
                        .eq(params.getRole() != null, User::getRole, params.getRole())
                        .eq(params.getStatus() != null, User::getStatus, params.getStatus())
                        .orderByDesc(User::getId));
        return new PageResult<>(page.getRecords().stream().map(this::toVO).toList(),
                page.getTotal(), page.getCurrent(), page.getSize());
    }

    @Override
    @Transactional
    public Long createUser(AdminUserDTO dto) {
        if (dto == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "用户信息不能为空");
        }
        validatePassword(dto.getPassword());
        User user = new User();
        applyFields(user, dto, true);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        if (userMapper.insert(user) > 0) {
            siteStatsCache.evictAfterCommit();
        }
        return user.getId();
    }

    @Override
    @Transactional
    public UserVO updateUser(AdminUserDTO dto) {
        if (dto == null || dto.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "用户ID不能为空");
        }
        User existing = requireUser(dto.getId());
        if (existing.getId().equals(UserContext.getUserId())
                && (Integer.valueOf(0).equals(dto.getStatus())
                || (dto.getRole() != null && !User.ROLE_ADMIN.equals(dto.getRole())))) {
            throw new BusinessException(ResultCode.FORBIDDEN, "不能禁用或降级当前登录管理员");
        }
        if (dto.getPassword() != null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "请使用重置密码功能修改密码");
        }
        User patch = new User().setId(existing.getId());
        applyFields(patch, dto, false);
        if (userMapper.updateById(patch) == 0) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        siteStatsCache.evictAfterCommit();
        if (dto.getAvatar() != null) {
            ossReferenceService.deleteIfUnused(existing.getAvatar(), patch.getAvatar());
        }
        return toVO(requireUser(existing.getId()));
    }

    @Override
    @Transactional
    public void resetPassword(Long id, String newPassword) {
        requireUser(id);
        validatePassword(newPassword);
        if (userMapper.updateById(new User().setId(id).setPassword(passwordEncoder.encode(newPassword))) == 0) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = requireUser(id);
        if (id.equals(UserContext.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN, "不能删除当前登录管理员");
        }
        if (articleMapper.selectCount(Wrappers.<Article>lambdaQuery().eq(Article::getAuthorId, id)) > 0) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "该用户仍有关联文章，请先处理文章或禁用账号");
        }
        // 保留友链申请及审核记录，清除已删除账号的关联。
        friendLinkMapper.update(null, Wrappers.<FriendLink>lambdaUpdate()
                .eq(FriendLink::getApplyUserId, id).set(FriendLink::getApplyUserId, null));
        if (userMapper.deleteById(id) == 0) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        siteStatsCache.evictAfterCommit();
        ossReferenceService.deleteIfUnused(user.getAvatar());
    }

    private void applyFields(User user, AdminUserDTO dto, boolean creating) {
        validateRoleAndStatus(dto.getRole(), dto.getStatus());
        if (creating || dto.getUsername() != null) {
            String username = dto.getUsername() == null ? "" : dto.getUsername().trim();
            if (username.length() < 3 || username.length() > 20) {
                throw new BusinessException(ResultCode.PARAM_ERROR, "用户名长度需在 3-20 个字符之间");
            }
            if (userMapper.exists(Wrappers.<User>lambdaQuery().eq(User::getUsername, username)
                    .ne(user.getId() != null, User::getId, user.getId()))) {
                throw new BusinessException(ResultCode.USERNAME_ALREADY_EXISTS);
            }
            user.setUsername(username);
        }
        if (creating || dto.getEmail() != null) {
            String email = dto.getEmail() == null ? "" : dto.getEmail().trim().toLowerCase(Locale.ROOT);
            if (email.length() > 255 || !EMAIL_PATTERN.matcher(email).matches()) {
                throw new BusinessException(ResultCode.PARAM_ERROR, "邮箱格式不正确");
            }
            if (userMapper.exists(Wrappers.<User>lambdaQuery().eq(User::getEmail, email)
                    .ne(user.getId() != null, User::getId, user.getId()))) {
                throw new BusinessException(ResultCode.EMAIL_ALREADY_REGISTERED);
            }
            user.setEmail(email);
        }
        if (creating || dto.getNickname() != null) {
            String nickname = dto.getNickname() == null ? "" : dto.getNickname().trim();
            if (nickname.length() > 50) {
                throw new BusinessException(ResultCode.PARAM_ERROR, "昵称不能超过 50 个字符");
            }
            user.setNickname(creating && nickname.isEmpty() ? user.getUsername() : nickname);
        }
        if (dto.getAvatar() != null) {
            String avatar = dto.getAvatar().trim();
            if (avatar.length() > 1024 || (!avatar.isEmpty()
                    && !avatar.startsWith("https://") && !avatar.startsWith("http://"))) {
                throw new BusinessException(ResultCode.PARAM_ERROR, "头像地址需以 http:// 或 https:// 开头，且不超过 1024 个字符");
            }
            user.setAvatar(avatar);
        }
        if (creating || dto.getRole() != null) {
            user.setRole(dto.getRole() == null ? User.ROLE_USER : dto.getRole());
        }
        if (creating || dto.getStatus() != null) {
            user.setStatus(dto.getStatus() == null ? 1 : dto.getStatus());
        }
    }

    private void validateRoleAndStatus(Integer role, Integer status) {
        if (role != null && !User.ROLE_ADMIN.equals(role) && !User.ROLE_USER.equals(role)) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "角色只能是管理员或普通用户");
        }
        if (status != null && status != 0 && status != 1) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "状态只能是正常或禁用");
        }
    }

    private void validatePassword(String password) {
        if (!StringUtils.hasText(password) || password.length() < 6
                || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "密码至少 6 个字符，且 UTF-8 编码不能超过 72 字节");
        }
    }

    private User requireUser(Long id) {
        if (id == null || id <= 0) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "用户ID不正确");
        }
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        return user;
    }

    private UserVO toVO(User user) {
        UserVO vo = new UserVO();
        BeanUtils.copyProperties(user, vo);
        return vo;
    }
}
