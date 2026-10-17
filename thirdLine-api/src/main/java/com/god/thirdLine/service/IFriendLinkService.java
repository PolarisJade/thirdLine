package com.god.thirdLine.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.domain.dto.FriendLinkApplyDTO;
import com.god.thirdLine.domain.dto.FriendLinkAuditDTO;
import com.god.thirdLine.domain.dto.FriendLinkDTO;
import com.god.thirdLine.domain.entity.FriendLink;
import com.god.thirdLine.domain.query.FriendLinkQuery;
import com.god.thirdLine.domain.vo.FriendLinkAdminVO;
import com.god.thirdLine.domain.vo.FriendLinkVO;

import java.util.List;

/**
 * <p>
 * 友情链接表 服务类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-10-17
 */
public interface IFriendLinkService extends IService<FriendLink> {

    /**
     * 查询前台可见友链（status=1 且 auditStatus=1），按新增顺序倒序
     *
     * @return 前台展示用友链列表
     */
    List<FriendLinkVO> listVisibleLinks();

    /**
     * 访客提交友链申请，落库后为待审核状态
     *
     * @param dto         申请内容
     * @param applyUserId 当前登录用户ID，游客为 null
     */
    void apply(FriendLinkApplyDTO dto, Long applyUserId);

    /**
     * 标准分页查询友链（后台管理，可按审核状态/显示状态/来源/关键词过滤）
     *
     * @param query 查询条件
     * @return 分页结果
     */
    PageResult<FriendLinkAdminVO> pageFriendLinks(FriendLinkQuery query);

    /**
     * 根据ID查询友链详情（后台编辑回填用）
     *
     * @param id 友链ID
     * @return 友链详情（含邮箱、备注等内部字段）
     */
    FriendLinkAdminVO getFriendLinkDetail(Long id);

    /**
     * 后台新增友链，直接置为已通过并立即生效
     *
     * @param dto 友链数据
     * @return 新增友链ID
     */
    Long saveFriendLink(FriendLinkDTO dto);

    /**
     * 修改友链（字段为 null 表示不动原值）
     *
     * @param dto 友链数据，id 必填
     */
    void updateFriendLink(FriendLinkDTO dto);

    /**
     * 根据ID删除友链
     *
     * @param id 友链ID
     */
    void deleteFriendLink(Long id);

    /**
     * 审核友链：通过后立即前台可见，拒绝需填写原因
     *
     * @param dto 审核参数
     */
    void audit(FriendLinkAuditDTO dto);

    /**
     * 切换友链显示状态（审核通过后临时上下线用）
     *
     * @param id     友链ID
     * @param status 0隐藏 / 1显示
     */
    void updateStatus(Long id, Integer status);
}
