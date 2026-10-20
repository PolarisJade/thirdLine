package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.FriendLinkApplyDTO;
import com.god.thirdLine.domain.dto.FriendLinkAuditDTO;
import com.god.thirdLine.domain.dto.FriendLinkDTO;
import com.god.thirdLine.domain.entity.FriendLink;
import com.god.thirdLine.domain.query.FriendLinkQuery;
import com.god.thirdLine.domain.vo.FriendLinkAdminVO;
import com.god.thirdLine.domain.vo.FriendLinkVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.FriendLinkMapper;
import com.god.thirdLine.service.IFriendLinkService;
import com.god.thirdLine.service.ISiteConfigService;
import com.god.thirdLine.service.MailService;
import com.god.thirdLine.service.SensitiveWordService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * <p>
 * 友情链接表 服务实现类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-10-17
 */
@Service
@RequiredArgsConstructor
public class FriendLinkServiceImpl extends ServiceImpl<FriendLinkMapper, FriendLink> implements IFriendLinkService {

    /** 站点名称最大长度，与 tl_friend_link.name 列宽一致 */
    private static final int MAX_NAME_LENGTH = 64;

    /** 站点地址最大长度，与 tl_friend_link.url 列宽一致 */
    private static final int MAX_URL_LENGTH = 255;

    /** 站点图标地址最大长度 */
    private static final int MAX_AVATAR_LENGTH = 500;

    /** 站点描述最大长度 */
    private static final int MAX_DESCRIPTION_LENGTH = 255;

    /** 联系邮箱最大长度 */
    private static final int MAX_EMAIL_LENGTH = 64;

    /** 拒绝原因最大长度 */
    private static final int MAX_REJECT_REASON_LENGTH = 200;

    /** 内部备注最大长度 */
    private static final int MAX_REMARK_LENGTH = 200;

    /** 站点地址格式：http/https + 无空白字符 */
    private static final Pattern URL_PATTERN = Pattern.compile("^https?://\\S+$", Pattern.CASE_INSENSITIVE);

    /** 邮箱格式，与注册接口保持同一套规则 */
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$");

    private final SensitiveWordService sensitiveWordService;
    private final MailService mailService;
    private final ISiteConfigService siteConfigService;

    @Override
    public List<FriendLinkVO> listVisibleLinks() {
        List<FriendLink> links = this.list(Wrappers.<FriendLink>lambdaQuery()
                .eq(FriendLink::getStatus, FriendLink.STATUS_VISIBLE)
                .eq(FriendLink::getAuditStatus, FriendLink.AUDIT_APPROVED)
                .orderByDesc(FriendLink::getId));
        return links.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public boolean isApplyEnabled() {
        return siteConfigService.isFriendLinkApplyEnabled();
    }

    @Override
    public void apply(FriendLinkApplyDTO dto, Long applyUserId) {
        if (!siteConfigService.isFriendLinkApplyEnabled()) {
            throw new BusinessException(ResultCode.FRIEND_LINK_APPLY_DISABLED);
        }
        if (dto == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "申请内容不能为空");
        }
        String name = checkName(dto.getName());
        String url = checkUrl(dto.getUrl());
        String avatar = checkOptional(dto.getAvatar(), MAX_AVATAR_LENGTH, "站点图标");
        String description = checkOptional(dto.getDescription(), MAX_DESCRIPTION_LENGTH, "站点描述");
        String email = checkEmail(dto.getEmail());
        checkSensitive(name, description);

        // 同一站点地址只允许存在一条记录：已经被占用的不重复受理，等管理员处理即可
        if (this.exists(Wrappers.<FriendLink>lambdaQuery().eq(FriendLink::getUrl, url))) {
            throw new BusinessException(ResultCode.FRIEND_LINK_URL_DUPLICATE);
        }

        FriendLink link = new FriendLink()
                .setName(name)
                .setUrl(url)
                .setAvatar(avatar)
                .setDescription(description)
                .setEmail(email)
                .setApplyUserId(applyUserId)
                .setSource(FriendLink.SOURCE_APPLY)
                .setAuditStatus(FriendLink.AUDIT_PENDING)
                .setStatus(FriendLink.STATUS_VISIBLE);
        try {
            this.save(link);
        } catch (DuplicateKeyException e) {
            // 公开接口存在并发提交同一地址的可能，兜住 uk_url 唯一约束，转成友好提示
            throw new BusinessException(ResultCode.FRIEND_LINK_URL_DUPLICATE);
        }
    }

    @Override
    public PageResult<FriendLinkAdminVO> pageFriendLinks(FriendLinkQuery query) {
        FriendLinkQuery condition = query == null ? new FriendLinkQuery() : query;
        String keyword = condition.getKeyword();
        Page<FriendLink> page = new Page<>(condition.getPage(), condition.getSize());
        Page<FriendLink> result = this.page(page, Wrappers.<FriendLink>lambdaQuery()
                .eq(condition.getAuditStatus() != null, FriendLink::getAuditStatus, condition.getAuditStatus())
                .eq(condition.getStatus() != null, FriendLink::getStatus, condition.getStatus())
                .eq(condition.getSource() != null, FriendLink::getSource, condition.getSource())
                .and(StringUtils.hasText(keyword), w -> w
                        .like(FriendLink::getName, keyword)
                        .or()
                        .like(FriendLink::getUrl, keyword)
                        .or()
                        .like(FriendLink::getDescription, keyword))
                // 待审核排在最前，同状态下新提交的在前，管理员打开列表就能看到待办
                .orderByAsc(FriendLink::getAuditStatus)
                .orderByDesc(FriendLink::getId));
        List<FriendLinkAdminVO> records = result.getRecords().stream()
                .map(this::toAdminVO)
                .collect(Collectors.toList());
        return new PageResult<>(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public FriendLinkAdminVO getFriendLinkDetail(Long id) {
        return toAdminVO(getExisting(id));
    }

    @Override
    public Long saveFriendLink(FriendLinkDTO dto) {
        if (dto == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "友链内容不能为空");
        }
        String name = checkName(dto.getName());
        String url = checkUrl(dto.getUrl());
        String avatar = checkOptional(dto.getAvatar(), MAX_AVATAR_LENGTH, "站点图标");
        String description = checkOptional(dto.getDescription(), MAX_DESCRIPTION_LENGTH, "站点描述");
        String email = checkEmail(dto.getEmail());
        String remark = checkOptional(dto.getRemark(), MAX_REMARK_LENGTH, "备注");
        checkSensitive(name, description);
        if (this.exists(Wrappers.<FriendLink>lambdaQuery().eq(FriendLink::getUrl, url))) {
            throw new BusinessException(ResultCode.FRIEND_LINK_URL_DUPLICATE, "该站点地址已存在");
        }

        // 管理员直接添加等同于「申请并当场通过」，不再走审核流程
        FriendLink link = new FriendLink()
                .setName(name)
                .setUrl(url)
                .setAvatar(avatar)
                .setDescription(description)
                .setEmail(email)
                .setRemark(remark)
                .setSource(FriendLink.SOURCE_ADMIN)
                .setAuditStatus(FriendLink.AUDIT_APPROVED)
                .setStatus(dto.getStatus() == null ? FriendLink.STATUS_VISIBLE : checkStatus(dto.getStatus()))
                .setAuditTime(LocalDateTime.now());
        this.save(link);
        return link.getId();
    }

    @Override
    public void updateFriendLink(FriendLinkDTO dto) {
        if (dto == null || dto.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "友链ID不能为空");
        }
        FriendLink link = getExisting(dto.getId());

        // SET 子句交给 wrapper：updateById 走 NOT_NULL 策略，传空串清不掉列值，
        // 而 wrapper 的 set 允许把可空字段显式写回 NULL（清空描述、清空备注、清空邮箱）。
        LambdaUpdateWrapper<FriendLink> wrapper = Wrappers.<FriendLink>lambdaUpdate()
                .eq(FriendLink::getId, link.getId());
        // 实体只放非空字段，作用是触发 MetaObjectHandler 刷新 update_time
        FriendLink update = new FriendLink();

        String name = link.getName();
        if (dto.getName() != null) {
            name = checkName(dto.getName());
            wrapper.set(FriendLink::getName, name);
        }
        if (dto.getUrl() != null) {
            String url = checkUrl(dto.getUrl());
            // 换地址时校验占用（排除自身）
            if (!url.equals(link.getUrl())
                    && this.exists(Wrappers.<FriendLink>lambdaQuery()
                    .eq(FriendLink::getUrl, url)
                    .ne(FriendLink::getId, link.getId()))) {
                throw new BusinessException(ResultCode.FRIEND_LINK_URL_DUPLICATE, "该站点地址已存在");
            }
            wrapper.set(FriendLink::getUrl, url);
        }
        if (dto.getAvatar() != null) {
            wrapper.set(FriendLink::getAvatar, checkOptional(dto.getAvatar(), MAX_AVATAR_LENGTH, "站点图标"));
        }
        String description = link.getDescription();
        if (dto.getDescription() != null) {
            description = checkOptional(dto.getDescription(), MAX_DESCRIPTION_LENGTH, "站点描述");
            wrapper.set(FriendLink::getDescription, description);
        }
        if (dto.getEmail() != null) {
            wrapper.set(FriendLink::getEmail, checkEmail(dto.getEmail()));
        }
        if (dto.getRemark() != null) {
            wrapper.set(FriendLink::getRemark, checkOptional(dto.getRemark(), MAX_REMARK_LENGTH, "备注"));
        }
        if (dto.getStatus() != null) {
            update.setStatus(checkStatus(dto.getStatus()));
        }
        // 敏感词按「改完之后」的最终值校验
        checkSensitive(name, description);
        this.update(update, wrapper);
    }

    @Override
    public void deleteFriendLink(Long id) {
        FriendLink link = getExisting(id);
        // 站点图标是对方站点的外链，不属于本站 OSS 资源，删记录即可，不要连带删除文件
        this.removeById(link.getId());
    }

    @Override
    public void audit(FriendLinkAuditDTO dto) {
        if (dto == null || dto.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "友链ID不能为空");
        }
        Integer auditStatus = dto.getAuditStatus();
        // 审核只能给出结论，不允许退回待审核
        if (auditStatus == null
                || (auditStatus != FriendLink.AUDIT_APPROVED && auditStatus != FriendLink.AUDIT_REJECTED)) {
            throw new BusinessException(ResultCode.FRIEND_LINK_AUDIT_STATUS_INVALID);
        }
        FriendLink link = getExisting(dto.getId());

        // 记录审核前的状态：只有状态真正发生变化时才发通知，重复点同一个结论不会重复发邮件
        boolean firstApproval = auditStatus == FriendLink.AUDIT_APPROVED
                && !Integer.valueOf(FriendLink.AUDIT_APPROVED).equals(link.getAuditStatus());
        boolean firstRejection = auditStatus == FriendLink.AUDIT_REJECTED
                && !Integer.valueOf(FriendLink.AUDIT_REJECTED).equals(link.getAuditStatus());

        // 拒绝原因只在「拒绝」时要求填写，通过时必须显式写回 NULL 清掉上一次的拒绝记录
        String rejectReason = null;
        if (auditStatus == FriendLink.AUDIT_REJECTED) {
            rejectReason = checkOptional(dto.getRejectReason(), MAX_REJECT_REASON_LENGTH, "拒绝原因");
            if (!StringUtils.hasText(rejectReason)) {
                throw new BusinessException(ResultCode.FRIEND_LINK_REJECT_REASON_REQUIRED);
            }
        }

        FriendLink update = new FriendLink()
                .setAuditStatus(auditStatus)
                .setAuditTime(LocalDateTime.now());
        if (auditStatus == FriendLink.AUDIT_APPROVED) {
            // 审核通过即恢复显示，避免「通过但被隐藏」这种中间态
            update.setStatus(FriendLink.STATUS_VISIBLE);
        }
        this.update(update, Wrappers.<FriendLink>lambdaUpdate()
                .eq(FriendLink::getId, link.getId())
                .set(FriendLink::getRejectReason, rejectReason));

        // 仅对「访客申请 + 填写了邮箱」的审核结果发送通知；
        // 管理员直接添加的友链没有申请流程，不发送这封邮件。
        // 通过 / 拒绝都只在状态真正变化时发一次，邮件在线程池中异步发送。
        boolean isApplicant = Integer.valueOf(FriendLink.SOURCE_APPLY).equals(link.getSource());
        boolean hasEmail = StringUtils.hasText(link.getEmail());
        if (isApplicant && hasEmail) {
            if (firstApproval) {
                mailService.sendFriendLinkApproved(link.getEmail(), link.getName(), link.getUrl());
            } else if (firstRejection) {
                mailService.sendFriendLinkRejected(
                        link.getEmail(), link.getName(), link.getUrl(), rejectReason);
            }
        }
    }

    @Override
    public void updateStatus(Long id, Integer status) {
        FriendLink link = getExisting(id);
        link.setStatus(checkStatus(status));
        this.updateById(link);
    }

    /* ==================== 私有辅助方法 ==================== */

    private FriendLink getExisting(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "友链ID不能为空");
        }
        FriendLink link = this.getById(id);
        if (link == null) {
            throw new BusinessException(ResultCode.FRIEND_LINK_NOT_FOUND);
        }
        return link;
    }

    private Integer checkStatus(Integer status) {
        if (status == null || (status != FriendLink.STATUS_HIDDEN && status != FriendLink.STATUS_VISIBLE)) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "显示状态只能是 0隐藏 或 1显示");
        }
        return status;
    }

    private String checkName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new BusinessException(ResultCode.FRIEND_LINK_NAME_REQUIRED);
        }
        return checkOptional(name, MAX_NAME_LENGTH, "站点名称");
    }

    /**
     * 校验并规范化站点地址：必须带 http/https 协议头，统一去掉尾部斜杠，
     * 避免 https://a.com 与 https://a.com/ 被当成两个站点重复入库。
     */
    private String checkUrl(String url) {
        if (!StringUtils.hasText(url)) {
            throw new BusinessException(ResultCode.FRIEND_LINK_URL_REQUIRED);
        }
        String normalized = normalizeUrl(url.trim());
        if (!URL_PATTERN.matcher(normalized).matches()) {
            throw new BusinessException(ResultCode.FRIEND_LINK_URL_INVALID);
        }
        return checkOptional(normalized, MAX_URL_LENGTH, "站点地址");
    }

    private String normalizeUrl(String url) {
        String result = url;
        while (result.length() > "https://".length() && result.endsWith("/")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }

    private String checkEmail(String email) {
        String value = checkOptional(email, MAX_EMAIL_LENGTH, "联系邮箱");
        if (value != null && !EMAIL_PATTERN.matcher(value).matches()) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "联系邮箱格式不正确");
        }
        return value;
    }

    /**
     * 去除首尾空白并把空串归一化为 null，同时做长度校验
     */
    private String checkOptional(String value, int maxLength, String label) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new BusinessException(ResultCode.PARAM_ERROR, label + "不能超过 " + maxLength + " 个字符");
        }
        return trimmed;
    }

    /**
     * 站点名称与描述属于对外展示的 UGC 内容，复用敏感词词库
     */
    private void checkSensitive(String name, String description) {
        if (sensitiveWordService.contains(name) || sensitiveWordService.contains(description)) {
            throw new BusinessException(ResultCode.FRIEND_LINK_SENSITIVE);
        }
    }

    private FriendLinkVO toVO(FriendLink link) {
        FriendLinkVO vo = new FriendLinkVO();
        BeanUtils.copyProperties(link, vo);
        return vo;
    }

    private FriendLinkAdminVO toAdminVO(FriendLink link) {
        FriendLinkAdminVO vo = new FriendLinkAdminVO();
        BeanUtils.copyProperties(link, vo);
        return vo;
    }
}
