package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.DanmakuReportDTO;
import com.god.thirdLine.domain.dto.DanmakuSendDTO;
import com.god.thirdLine.domain.entity.Danmaku;
import com.god.thirdLine.domain.entity.DanmakuReport;
import com.god.thirdLine.domain.entity.User;
import com.god.thirdLine.domain.query.DanmakuQuery;
import com.god.thirdLine.domain.vo.DanmakuPoolVO;
import com.god.thirdLine.domain.vo.DanmakuReportVO;
import com.god.thirdLine.domain.vo.DanmakuVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.DanmakuMapper;
import com.god.thirdLine.mapper.DanmakuReportMapper;
import com.god.thirdLine.mapper.UserMapper;
import com.god.thirdLine.service.IDanmakuService;
import com.god.thirdLine.service.ISiteConfigService;
import com.god.thirdLine.service.SensitiveWordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * <p>
 * 弹幕 服务实现类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-27
 */
@Service
@RequiredArgsConstructor
public class DanmakuServiceImpl extends ServiceImpl<DanmakuMapper, Danmaku> implements IDanmakuService {

    /** 弹幕内容最大长度，与 tl_danmaku.content 列宽一致 */
    private static final int MAX_CONTENT_LENGTH = 100;

    /** 举报理由最大长度 */
    private static final int MAX_REASON_LENGTH = 200;

    /** 默认弹幕颜色 */
    private static final String DEFAULT_COLOR = "#FFFFFF";

    /** 同一用户两次发送弹幕的最小间隔（毫秒） */
    private static final long SEND_INTERVAL_MILLIS = 5_000L;

    /** 用户ID -> 上次发送时间戳（毫秒），单机内存限频，重启即清空 */
    private final Map<Long, Long> lastSendTime = new ConcurrentHashMap<>();

    private final UserMapper userMapper;
    private final DanmakuReportMapper danmakuReportMapper;
    private final SensitiveWordService sensitiveWordService;
    private final ISiteConfigService siteConfigService;

    @Override
    public DanmakuVO send(Long userId, DanmakuSendDTO dto) {
        if (userId == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        // 1. 全局开关：关闭后禁止发送
        if (!siteConfigService.isDanmakuEnabled()) {
            throw new BusinessException(ResultCode.DANMAKU_DISABLED);
        }
        // 2. 内容校验：非空 + 长度
        String content = dto == null || dto.getContent() == null ? "" : dto.getContent().trim();
        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ResultCode.DANMAKU_CONTENT_EMPTY);
        }
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new BusinessException(ResultCode.DANMAKU_CONTENT_TOO_LONG);
        }
        // 3. 敏感词校验
        if (sensitiveWordService.contains(content)) {
            throw new BusinessException(ResultCode.DANMAKU_SENSITIVE);
        }
        // 4. 频率限制
        long now = System.currentTimeMillis();
        Long last = lastSendTime.get(userId);
        if (last != null && now - last < SEND_INTERVAL_MILLIS) {
            throw new BusinessException(ResultCode.DANMAKU_SEND_TOO_FREQUENT);
        }
        lastSendTime.put(userId, now);

        // 落库
        LocalDateTime time = LocalDateTime.now();
        String color = dto == null || !StringUtils.hasText(dto.getColor()) ? DEFAULT_COLOR : dto.getColor().trim();
        Danmaku danmaku = new Danmaku()
                .setUserId(userId)
                .setContent(content)
                .setColor(color)
                .setStatus(1)
                .setCreateTime(time)
                .setUpdateTime(time);
        this.save(danmaku);

        DanmakuVO vo = toVO(danmaku);
        vo.setNickname(resolveNickname(userId));
        return vo;
    }

    @Override
    public DanmakuPoolVO getPool(int limit) {
        DanmakuPoolVO pool = new DanmakuPoolVO();
        boolean enabled = siteConfigService.isDanmakuEnabled();
        pool.setEnabled(enabled);
        if (!enabled) {
            pool.setItems(Collections.emptyList());
            return pool;
        }
        int size = Math.min(Math.max(limit, 1), 200);
        // 取最近 size 条（按 ID 降序），再反转为时间升序播放
        List<Danmaku> list = this.list(Wrappers.<Danmaku>lambdaQuery()
                .eq(Danmaku::getStatus, 1)
                .orderByDesc(Danmaku::getId)
                .last("LIMIT " + size));
        Collections.reverse(list);
        pool.setItems(withNicknames(list));
        return pool;
    }

    @Override
    public void report(Long userId, DanmakuReportDTO dto) {
        if (userId == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        if (dto == null || dto.getDanmakuId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "被举报弹幕ID不能为空");
        }
        Danmaku danmaku = this.getById(dto.getDanmakuId());
        if (danmaku == null || danmaku.getStatus() == null || danmaku.getStatus() != 1) {
            throw new BusinessException(ResultCode.DANMAKU_NOT_FOUND);
        }
        if (userId.equals(danmaku.getUserId())) {
            throw new BusinessException(ResultCode.DANMAKU_REPORT_SELF);
        }
        // 去重：同一用户对同一弹幕只能举报一次
        long exists = danmakuReportMapper.selectCount(Wrappers.<DanmakuReport>lambdaQuery()
                .eq(DanmakuReport::getDanmakuId, dto.getDanmakuId())
                .eq(DanmakuReport::getUserId, userId));
        if (exists > 0) {
            throw new BusinessException(ResultCode.DANMAKU_REPORT_DUPLICATE);
        }
        String reason = dto.getReason() == null ? null : dto.getReason().trim();
        if (reason != null && reason.length() > MAX_REASON_LENGTH) {
            reason = reason.substring(0, MAX_REASON_LENGTH);
        }
        LocalDateTime now = LocalDateTime.now();
        DanmakuReport report = new DanmakuReport()
                .setDanmakuId(dto.getDanmakuId())
                .setUserId(userId)
                .setReason(reason)
                .setStatus(DanmakuReport.STATUS_PENDING)
                .setCreateTime(now)
                .setUpdateTime(now);
        danmakuReportMapper.insert(report);
    }

    @Override
    public PageResult<DanmakuVO> pageDanmaku(DanmakuQuery query) {
        if (query == null) {
            query = new DanmakuQuery();
        }
        Page<Danmaku> page = new Page<>(query.getPage(), query.getSize());
        Page<Danmaku> result = this.page(page, Wrappers.<Danmaku>lambdaQuery()
                .eq(query.getStatus() != null, Danmaku::getStatus, query.getStatus())
                .orderByDesc(Danmaku::getId));
        List<DanmakuVO> records = withNicknames(result.getRecords());
        // 统计每条弹幕累计举报数
        fillReportCounts(records);
        return new PageResult<>(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public void updateStatus(Long id, Integer status) {
        if (id == null || status == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "弹幕ID与状态不能为空");
        }
        Danmaku danmaku = this.getById(id);
        if (danmaku == null) {
            throw new BusinessException(ResultCode.DANMAKU_NOT_FOUND);
        }
        danmaku.setStatus(status).setUpdateTime(LocalDateTime.now());
        this.updateById(danmaku);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteDanmaku(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "弹幕ID不能为空");
        }
        if (this.getById(id) == null) {
            throw new BusinessException(ResultCode.DANMAKU_NOT_FOUND);
        }
        this.removeById(id);
        danmakuReportMapper.delete(Wrappers.<DanmakuReport>lambdaQuery()
                .eq(DanmakuReport::getDanmakuId, id));
    }

    @Override
    public PageResult<DanmakuReportVO> pageReports(Integer status, Integer page, Integer size) {
        int current = page == null || page <= 0 ? 1 : page;
        int pageSize = size == null || size <= 0 ? 12 : Math.min(size, 100);
        Page<DanmakuReport> pager = new Page<>(current, pageSize);
        Page<DanmakuReport> result = danmakuReportMapper.selectPage(pager, Wrappers.<DanmakuReport>lambdaQuery()
                .eq(status != null, DanmakuReport::getStatus, status)
                .orderByDesc(DanmakuReport::getId));
        List<DanmakuReport> rows = result.getRecords();

        // 批量加载：被举报弹幕 + 相关用户昵称
        Set<Long> danmakuIds = rows.stream().map(DanmakuReport::getDanmakuId).collect(Collectors.toSet());
        Map<Long, Danmaku> danmakuMap = danmakuIds.isEmpty() ? Collections.emptyMap()
                : this.listByIds(danmakuIds).stream().collect(Collectors.toMap(Danmaku::getId, d -> d));
        Set<Long> userIds = new HashSet<>();
        rows.forEach(r -> userIds.add(r.getUserId()));
        danmakuMap.values().forEach(d -> {
            if (d.getUserId() != null) {
                userIds.add(d.getUserId());
            }
        });
        userIds.remove(null);
        Map<Long, String> nicknameMap = resolveNicknames(userIds);

        List<DanmakuReportVO> records = new ArrayList<>(rows.size());
        for (DanmakuReport r : rows) {
            DanmakuReportVO vo = new DanmakuReportVO();
            vo.setId(r.getId());
            vo.setDanmakuId(r.getDanmakuId());
            vo.setReason(r.getReason());
            vo.setStatus(r.getStatus());
            vo.setCreateTime(r.getCreateTime());
            Danmaku d = danmakuMap.get(r.getDanmakuId());
            if (d != null) {
                vo.setDanmakuContent(d.getContent());
                vo.setDanmakuNickname(nicknameMap.get(d.getUserId()));
            }
            vo.setReporterNickname(nicknameMap.get(r.getUserId()));
            records.add(vo);
        }
        return new PageResult<>(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public void handleReport(Long reportId) {
        if (reportId == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "举报记录ID不能为空");
        }
        DanmakuReport report = danmakuReportMapper.selectById(reportId);
        if (report == null) {
            throw new BusinessException(ResultCode.DANMAKU_REPORT_NOT_FOUND);
        }
        report.setStatus(DanmakuReport.STATUS_HANDLED).setUpdateTime(LocalDateTime.now());
        danmakuReportMapper.updateById(report);
    }

    /* ==================== 私有辅助方法 ==================== */

    private DanmakuVO toVO(Danmaku danmaku) {
        DanmakuVO vo = new DanmakuVO();
        vo.setId(danmaku.getId());
        vo.setUserId(danmaku.getUserId());
        vo.setContent(danmaku.getContent());
        vo.setColor(danmaku.getColor());
        vo.setStatus(danmaku.getStatus());
        vo.setCreateTime(danmaku.getCreateTime());
        return vo;
    }

    /** 将实体列表转为带昵称的 VO 列表（批量查用户，避免 N+1） */
    private List<DanmakuVO> withNicknames(List<Danmaku> list) {
        if (list == null || list.isEmpty()) {
            return new ArrayList<>();
        }
        Set<Long> userIds = list.stream().map(Danmaku::getUserId).collect(Collectors.toSet());
        userIds.remove(null);
        Map<Long, String> nicknameMap = resolveNicknames(userIds);
        return list.stream().map(d -> {
            DanmakuVO vo = toVO(d);
            vo.setNickname(nicknameMap.get(d.getUserId()));
            return vo;
        }).collect(Collectors.toList());
    }

    /** 为后台列表填充每条弹幕的累计举报数 */
    private void fillReportCounts(List<DanmakuVO> list) {
        if (list == null || list.isEmpty()) {
            return;
        }
        List<Long> ids = list.stream().map(DanmakuVO::getId).collect(Collectors.toList());
        List<DanmakuReport> reports = danmakuReportMapper.selectList(Wrappers.<DanmakuReport>lambdaQuery()
                .in(DanmakuReport::getDanmakuId, ids)
                .select(DanmakuReport::getDanmakuId));
        Map<Long, Long> countMap = reports.stream()
                .collect(Collectors.groupingBy(DanmakuReport::getDanmakuId, Collectors.counting()));
        list.forEach(vo -> vo.setReportCount(countMap.getOrDefault(vo.getId(), 0L).intValue()));
    }

    private String resolveNickname(Long userId) {
        if (userId == null) {
            return null;
        }
        Map<Long, String> map = resolveNicknames(Collections.singleton(userId));
        return map.get(userId);
    }

    /** 批量解析用户ID -> 展示昵称（昵称为空回退用户名） */
    private Map<Long, String> resolveNicknames(Set<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<User> users = userMapper.selectList(Wrappers.<User>lambdaQuery()
                .in(User::getId, userIds)
                .select(User::getId, User::getNickname, User::getUsername));
        return users.stream().collect(Collectors.toMap(User::getId,
                u -> StringUtils.hasText(u.getNickname()) ? u.getNickname() : u.getUsername(),
                (a, b) -> a));
    }
}
