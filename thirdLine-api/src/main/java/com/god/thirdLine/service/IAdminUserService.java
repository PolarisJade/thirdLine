package com.god.thirdLine.service;

import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.domain.dto.AdminUserDTO;
import com.god.thirdLine.domain.query.UserQuery;
import com.god.thirdLine.domain.vo.UserVO;

/** 管理员维护用户账号。 */
public interface IAdminUserService {
    PageResult<UserVO> pageUsers(UserQuery query);

    Long createUser(AdminUserDTO dto);

    UserVO updateUser(AdminUserDTO dto);

    void resetPassword(Long id, String newPassword);

    void deleteUser(Long id);
}
