package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.WallNoteAuditDTO;
import com.god.thirdLine.domain.dto.WallNoteCreateDTO;
import com.god.thirdLine.domain.dto.WallNoteMoveDTO;
import com.god.thirdLine.domain.dto.WallNoteReportDTO;
import com.god.thirdLine.domain.dto.WallReportHandleDTO;
import com.god.thirdLine.domain.entity.WallNote;
import com.god.thirdLine.domain.entity.WallNoteReport;
import com.god.thirdLine.domain.query.WallNoteQuery;
import com.god.thirdLine.domain.query.WallReportQuery;
import com.god.thirdLine.domain.vo.WallColorVO;
import com.god.thirdLine.domain.vo.WallConfigVO;
import com.god.thirdLine.domain.vo.WallListVO;
import com.god.thirdLine.domain.vo.WallMoveResultVO;
import com.god.thirdLine.domain.vo.WallNoteAdminVO;
import com.god.thirdLine.domain.vo.WallNoteVO;
import com.god.thirdLine.domain.vo.WallReportAdminVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.WallNoteMapper;
import com.god.thirdLine.mapper.WallNoteReportMapper;
import com.god.thirdLine.service.ISiteConfigService;
import com.god.thirdLine.service.IWallNoteService;
import com.god.thirdLine.service.SensitiveWordService;
import com.god.thirdLine.util.WallLayout;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 留言墙服务实现。
 *
 * <p>几个关键约定：</p>
 * <ul>
 *   <li>待审核留言不占位：只有「已通过 + 显示中」的信纸参与碰撞检测，
 *       审核通过时才真正落位，避免墙面上出现别人看不见的空洞。</li>
 *   <li>位置一律由服务端裁决：前端拖动只是预览，落库前会用同一套算法重新算一遍，
 *       并发提交也不会出现两张信纸叠在一起。</li>
 *   <li>只有「因举报自动隐藏」的留言，才会在举报被判定不成立后自动恢复；
 *       站主手动隐藏的留言不会被误恢复。</li>
 * </ul>
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WallNoteServiceImpl extends ServiceImpl<WallNoteMapper, WallNote> implements IWallNoteService {

    /* ------------------------------------------------------------------ 配置键 */

    private static final String CFG_ENABLED = "wall_enabled";
    private static final String CFG_NOTICE = "wall_notice";
    private static final String CFG_PALETTE = "wall_palette";
    private static final String CFG_MAX_LENGTH = "wall_max_length";
    private static final String CFG_MAX_NOTES = "wall_max_notes";
    private static final String CFG_DAILY_LIMIT = "wall_daily_limit_per_user";
    private static final String CFG_REPORT_THRESHOLD = "wall_report_hide_threshold";

    private static final String DEFAULT_NOTICE = "留言需要审核，通过后才会出现在墙上；请勿发布广告、人身攻击或违法内容。";
    private static final int DEFAULT_MAX_LENGTH = 120;
    private static final int DEFAULT_MAX_NOTES = 50;
    private static final int DEFAULT_DAILY_LIMIT = 5;
    private static final int DEFAULT_REPORT_THRESHOLD = 3;

    /** 与 tl_wall_note.content 的列宽保持一致 */
    private static final int CONTENT_COLUMN_LENGTH = 255;

    /** 与 tl_wall_note.audit_remark 的列宽保持一致 */
    private static final int REMARK_MAX_LENGTH = 200;

    /** 与 tl_wall_note_report.reason 的列宽保持一致 */
    private static final int REPORT_REASON_MAX_LENGTH = 255;

    /** 同一条内容 30 秒内只允许提交一次，防连点与网络重试 */
    private static final int PUBLISH_COOLDOWN_SECONDS = 30;

    private static final ObjectMapper JSON_MAPPER = JsonMapper.builder().build();

    /** 配置缺失或解析失败时的兜底色板，和建表脚本里的默认值一致 */
    private static final List<WallColorVO> DEFAULT_PALETTE = List.of(
            color("pink", "樱粉", "#FFD9E3"),
            color("purple", "薰衣草", "#E4D8FF"),
            color("yellow", "暖黄", "#FFF1B8"),
            color("orange", "杏橙", "#FFDCC0"),
            color("green", "薄荷", "#CFF4DD"),
            color("blue", "天空", "#D3E9FF"));

    private final SensitiveWordService sensitiveWordService;
    private final ISiteConfigService siteConfigService;
    private final StringRedisTemplate stringRedisTemplate;
    private final WallNoteReportMapper wallNoteReportMapper;

    /* ==================================================================== 前台 */

    @Override
    public WallConfigVO getConfig() {
        WallConfigVO config = new WallConfigVO();
        config.setEnabled(isEnabled());
        config.setNotice(siteConfigService.getValue(CFG_NOTICE, DEFAULT_NOTICE));
        config.setMaxLength(maxLength());
        config.setMaxNotes(maxNotes());
        config.setCanvasWidth(WallLayout.CANVAS_WIDTH);
        config.setCanvasHeight(WallLayout.CANVAS_HEIGHT);
        config.setPaperWidth(WallLayout.PAPER_WIDTH);
        config.setPaperHeight(WallLayout.PAPER_HEIGHT);
        config.setGap(WallLayout.GAP);
        config.setGrid(WallLayout.GRID);
        config.setPalette(palette());
        return config;
    }

    @Override
    public WallListVO listVisible(Long currentUserId) {
        List<WallNote> notes = new ArrayList<>(this.list(Wrappers.<WallNote>lambdaQuery()
                .eq(WallNote::getAuditStatus, WallNote.AUDIT_APPROVED)
                .eq(WallNote::getStatus, WallNote.STATUS_VISIBLE)
                .orderByAsc(WallNote::getId)));

        // 作者自己的待审核留言也一并返回（仅本人可见）：
        // 刷新后它还在墙上，也可以继续拖动，但不会占别人的位置、不会泄露给其他人
        if (currentUserId != null) {
            List<WallNote> pending = this.list(Wrappers.<WallNote>lambdaQuery()
                    .eq(WallNote::getUserId, currentUserId)
                    .eq(WallNote::getAuditStatus, WallNote.AUDIT_PENDING)
                    .eq(WallNote::getStatus, WallNote.STATUS_VISIBLE)
                    .orderByAsc(WallNote::getId));
            if (!pending.isEmpty()) {
                notes.addAll(pending);
                notes.sort(Comparator.comparing(WallNote::getId));
            }
        }

        WallListVO result = new WallListVO();
        result.setNotes(notes.stream().map(note -> toVO(note, currentUserId)).collect(Collectors.toList()));
        result.setVersion(versionOf(notes));
        result.setMaxNotes(maxNotes());
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WallNoteVO create(WallNoteCreateDTO dto, Long userId) {
        checkEnabled();
        if (userId == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        if (dto == null) {
            throw new BusinessException(ResultCode.WALL_NOTE_CONTENT_EMPTY);
        }

        int maxLength = maxLength();
        String content = checkContent(dto.getContent(), maxLength);
        if (sensitiveWordService.contains(content)) {
            throw new BusinessException(ResultCode.WALL_NOTE_SENSITIVE);
        }
        checkPublishLimit(userId, content);

        long visibleCount = this.count(Wrappers.<WallNote>lambdaQuery()
                .eq(WallNote::getAuditStatus, WallNote.AUDIT_APPROVED)
                .eq(WallNote::getStatus, WallNote.STATUS_VISIBLE));
        if (visibleCount >= maxNotes()) {
            throw new BusinessException(ResultCode.WALL_FULL);
        }

        double desiredX = dto.getPosX() == null
                ? (WallLayout.CANVAS_WIDTH - WallLayout.PAPER_WIDTH) / 2
                : dto.getPosX();
        double desiredY = dto.getPosY() == null
                ? (WallLayout.CANVAS_HEIGHT - WallLayout.PAPER_HEIGHT) / 2
                : dto.getPosY();
        WallLayout.Point position = WallLayout.place(desiredX, desiredY, occupied(null));
        if (position == null) {
            throw new BusinessException(ResultCode.WALL_FULL);
        }

        WallNote note = new WallNote()
                .setContent(content)
                .setPaperColor(checkColor(dto.getPaperColor(), palette()))
                .setPosX(position.x())
                .setPosY(position.y())
                .setRotateDeg(randomRotation())
                .setAuditStatus(WallNote.AUDIT_PENDING)
                .setStatus(WallNote.STATUS_VISIBLE)
                .setReportCount(0)
                .setUserId(userId)
                .setDeleted(0)
                .setVersion(0);
        this.save(note);
        return toVO(note, userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WallMoveResultVO move(Long id, WallNoteMoveDTO dto, Long userId) {
        WallNote note = getExisting(id);
        if (userId == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        if (!userId.equals(note.getUserId())) {
            throw new BusinessException(ResultCode.WALL_NOTE_FORBIDDEN);
        }
        if (Integer.valueOf(WallNote.AUDIT_REJECTED).equals(note.getAuditStatus())) {
            throw new BusinessException(ResultCode.WALL_NOTE_NOT_FOUND);
        }
        if (dto == null || dto.getPosX() == null || dto.getPosY() == null || dto.getVersion() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "位置和版本号不能为空");
        }

        WallLayout.Point position = WallLayout.place(dto.getPosX(), dto.getPosY(), occupied(id));
        if (position == null) {
            throw new BusinessException(ResultCode.WALL_FULL);
        }

        WallNote update = new WallNote()
                .setId(id)
                .setPosX(position.x())
                .setPosY(position.y())
                .setVersion(dto.getVersion());
        boolean success = this.updateById(update);
        if (!success) {
            throw new BusinessException(ResultCode.WALL_POSITION_CONFLICT);
        }

        WallLayout.Point desired = WallLayout.normalize(dto.getPosX(), dto.getPosY());
        WallMoveResultVO result = new WallMoveResultVO();
        result.setId(id);
        result.setPosX(position.x());
        result.setPosY(position.y());
        result.setVersion(dto.getVersion() + 1);
        result.setAdjusted(!WallLayout.samePosition(position, desired.x(), desired.y()));
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id, Long userId) {
        WallNote note = getExisting(id);
        if (userId == null || !userId.equals(note.getUserId())) {
            throw new BusinessException(ResultCode.WALL_NOTE_FORBIDDEN);
        }
        this.removeById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void report(Long id, WallNoteReportDTO dto, Long userId) {
        checkEnabled();
        if (userId == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        WallNote note = getExisting(id);
        if (userId.equals(note.getUserId())) {
            throw new BusinessException(ResultCode.WALL_REPORT_SELF);
        }
        if (!Integer.valueOf(WallNote.AUDIT_APPROVED).equals(note.getAuditStatus())
                || !Integer.valueOf(WallNote.STATUS_VISIBLE).equals(note.getStatus())) {
            throw new BusinessException(ResultCode.WALL_NOTE_NOT_FOUND);
        }
        int reasonType = dto == null || dto.getReasonType() == null ? 0 : dto.getReasonType();
        if (reasonType < WallNoteReport.REASON_SPAM || reasonType > WallNoteReport.REASON_OTHER) {
            throw new BusinessException(ResultCode.WALL_REPORT_REASON_INVALID);
        }

        WallNoteReport report = new WallNoteReport()
                .setNoteId(id)
                .setReporterUserId(userId)
                .setReasonType(reasonType)
                .setReason(checkOptional(dto.getReason(), REPORT_REASON_MAX_LENGTH, "补充说明"))
                .setStatus(WallNoteReport.STATUS_PENDING);
        try {
            wallNoteReportMapper.insert(report);
        } catch (DuplicateKeyException e) {
            throw new BusinessException(ResultCode.WALL_REPORT_DUPLICATE);
        }

        // 原子自增，避免并发举报时读-改-写丢计数
        this.update(Wrappers.<WallNote>lambdaUpdate()
                .eq(WallNote::getId, id)
                .setSql("report_count = report_count + 1"));

        int threshold = reportThreshold();
        WallNote refreshed = this.getById(id);
        if (refreshed != null && threshold > 0
                && refreshed.getReportCount() != null && refreshed.getReportCount() >= threshold
                && Integer.valueOf(WallNote.STATUS_VISIBLE).equals(refreshed.getStatus())) {
            this.update(Wrappers.<WallNote>lambdaUpdate()
                    .eq(WallNote::getId, id)
                    .set(WallNote::getStatus, WallNote.STATUS_HIDDEN)
                    .set(WallNote::getAuditRemark, WallNote.AUTO_HIDE_REMARK)
                    .set(WallNote::getUpdateTime, LocalDateTime.now()));
            log.info("留言 {} 被举报 {} 次，已自动隐藏待复核", id, refreshed.getReportCount());
        }
    }

    /* ==================================================================== 后台 */

    @Override
    public PageResult<WallNoteAdminVO> pageNotes(WallNoteQuery query) {
        WallNoteQuery condition = query == null ? new WallNoteQuery() : query;
        String keyword = StringUtils.hasText(condition.getKeyword()) ? condition.getKeyword().trim() : null;
        Page<WallNote> page = new Page<>(condition.getPage(), condition.getSize());
        Page<WallNote> result = this.page(page, Wrappers.<WallNote>lambdaQuery()
                .eq(condition.getAuditStatus() != null, WallNote::getAuditStatus, condition.getAuditStatus())
                .eq(condition.getStatus() != null, WallNote::getStatus, condition.getStatus())
                .like(keyword != null, WallNote::getContent, keyword)
                // 待审核排最前，同状态新提交的在前
                .orderByAsc(WallNote::getAuditStatus)
                .orderByDesc(WallNote::getId));
        List<WallNoteAdminVO> records = result.getRecords().stream()
                .map(this::toAdminVO)
                .collect(Collectors.toList());
        return new PageResult<>(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void audit(Long id, WallNoteAuditDTO dto) {
        WallNote note = getExisting(id);
        int target = dto == null || dto.getAuditStatus() == null ? -1 : dto.getAuditStatus();
        if (target != WallNote.AUDIT_APPROVED && target != WallNote.AUDIT_REJECTED) {
            throw new BusinessException(ResultCode.WALL_AUDIT_STATUS_INVALID);
        }

        String remark = checkOptional(dto.getAuditRemark(), REMARK_MAX_LENGTH, "审核意见");
        LocalDateTime now = LocalDateTime.now();

        if (target == WallNote.AUDIT_REJECTED) {
            if (!StringUtils.hasText(remark)) {
                throw new BusinessException(ResultCode.PARAM_ERROR, "拒绝时请填写原因");
            }
            this.update(Wrappers.<WallNote>lambdaUpdate()
                    .eq(WallNote::getId, id)
                    .set(WallNote::getAuditStatus, WallNote.AUDIT_REJECTED)
                    .set(WallNote::getAuditRemark, remark)
                    .set(WallNote::getAuditTime, now)
                    .set(WallNote::getUpdateTime, now));
            return;
        }

        // 通过时要重新落位：待审核期间它不占位，原来的位置可能已经被后来通过的信纸占了
        boolean needPlacement = !Integer.valueOf(WallNote.AUDIT_APPROVED).equals(note.getAuditStatus())
                || !Integer.valueOf(WallNote.STATUS_VISIBLE).equals(note.getStatus());
        double posX = note.getPosX() == null ? (WallLayout.CANVAS_WIDTH - WallLayout.PAPER_WIDTH) / 2 : note.getPosX();
        double posY = note.getPosY() == null ? (WallLayout.CANVAS_HEIGHT - WallLayout.PAPER_HEIGHT) / 2 : note.getPosY();
        if (needPlacement) {
            WallLayout.Point position = WallLayout.place(posX, posY, occupied(id));
            if (position == null) {
                throw new BusinessException(ResultCode.WALL_FULL);
            }
            posX = position.x();
            posY = position.y();
        }

        this.update(Wrappers.<WallNote>lambdaUpdate()
                .eq(WallNote::getId, id)
                .set(WallNote::getAuditStatus, WallNote.AUDIT_APPROVED)
                .set(WallNote::getStatus, WallNote.STATUS_VISIBLE)
                .set(WallNote::getAuditRemark, remark)
                .set(WallNote::getAuditTime, now)
                .set(WallNote::getPosX, posX)
                .set(WallNote::getPosY, posY)
                // 站主已经看过这条留言，举报计数清零，避免几次误报后一直被自动隐藏
                .set(WallNote::getReportCount, 0)
                .set(WallNote::getUpdateTime, now));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, Integer status) {
        WallNote note = getExisting(id);
        if (status == null
                || (status != WallNote.STATUS_HIDDEN && status != WallNote.STATUS_VISIBLE)) {
            throw new BusinessException(ResultCode.WALL_STATUS_INVALID);
        }
        LocalDateTime now = LocalDateTime.now();

        if (status == WallNote.STATUS_HIDDEN) {
            this.update(Wrappers.<WallNote>lambdaUpdate()
                    .eq(WallNote::getId, id)
                    .set(WallNote::getStatus, WallNote.STATUS_HIDDEN)
                    .set(WallNote::getUpdateTime, now));
            return;
        }

        // 重新显示同样要落位，避免和后来占位的信纸重叠
        double posX = note.getPosX() == null ? (WallLayout.CANVAS_WIDTH - WallLayout.PAPER_WIDTH) / 2 : note.getPosX();
        double posY = note.getPosY() == null ? (WallLayout.CANVAS_HEIGHT - WallLayout.PAPER_HEIGHT) / 2 : note.getPosY();
        WallLayout.Point position = WallLayout.place(posX, posY, occupied(id));
        if (position == null) {
            throw new BusinessException(ResultCode.WALL_FULL);
        }
        String remark = WallNote.AUTO_HIDE_REMARK.equals(note.getAuditRemark()) ? null : note.getAuditRemark();
        this.update(Wrappers.<WallNote>lambdaUpdate()
                .eq(WallNote::getId, id)
                .set(WallNote::getStatus, WallNote.STATUS_VISIBLE)
                .set(WallNote::getAuditRemark, remark)
                .set(WallNote::getPosX, position.x())
                .set(WallNote::getPosY, position.y())
                // 站主手动恢复，视为已经复核，清掉历史举报计数
                .set(WallNote::getReportCount, 0)
                .set(WallNote::getUpdateTime, now));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void adminDelete(Long id) {
        getExisting(id);
        this.removeById(id);
    }

    @Override
    public PageResult<WallReportAdminVO> pageReports(WallReportQuery query) {
        WallReportQuery condition = query == null ? new WallReportQuery() : query;
        Page<WallNoteReport> page = new Page<>(condition.getPage(), condition.getSize());
        Page<WallNoteReport> result = wallNoteReportMapper.selectPage(page, Wrappers.<WallNoteReport>lambdaQuery()
                .eq(condition.getStatus() != null, WallNoteReport::getStatus, condition.getStatus())
                // 待处理排最前
                .orderByAsc(WallNoteReport::getStatus)
                .orderByDesc(WallNoteReport::getId));

        List<Long> noteIds = result.getRecords().stream()
                .map(WallNoteReport::getNoteId)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, WallNote> noteMap = noteIds.isEmpty()
                ? Collections.emptyMap()
                : this.listByIds(noteIds).stream()
                .collect(Collectors.toMap(WallNote::getId, Function.identity(), (a, b) -> a));

        List<WallReportAdminVO> records = new ArrayList<>();
        for (WallNoteReport report : result.getRecords()) {
            WallReportAdminVO vo = new WallReportAdminVO();
            BeanUtils.copyProperties(report, vo);
            WallNote note = noteMap.get(report.getNoteId());
            if (note != null) {
                vo.setNoteContent(note.getContent());
                vo.setNoteStatus(note.getStatus());
            }
            records.add(vo);
        }
        return new PageResult<>(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void handleReport(Long reportId, WallReportHandleDTO dto) {
        WallNoteReport report = reportId == null ? null : wallNoteReportMapper.selectById(reportId);
        if (report == null) {
            throw new BusinessException(ResultCode.WALL_NOTE_NOT_FOUND, "举报记录不存在");
        }
        if (!Integer.valueOf(WallNoteReport.STATUS_PENDING).equals(report.getStatus())) {
            throw new BusinessException(ResultCode.WALL_REPORT_ALREADY_HANDLED);
        }
        int target = dto == null || dto.getStatus() == null ? -1 : dto.getStatus();
        if (target != WallNoteReport.STATUS_ACCEPTED && target != WallNoteReport.STATUS_REJECTED) {
            throw new BusinessException(ResultCode.WALL_REPORT_STATUS_INVALID);
        }

        LocalDateTime now = LocalDateTime.now();
        String handleRemark = checkOptional(dto.getHandleRemark(), REMARK_MAX_LENGTH, "处理备注");
        wallNoteReportMapper.update(null, Wrappers.<WallNoteReport>lambdaUpdate()
                .eq(WallNoteReport::getId, reportId)
                .set(WallNoteReport::getStatus, target)
                .set(WallNoteReport::getHandleRemark, handleRemark)
                .set(WallNoteReport::getHandleTime, now));

        if (target == WallNoteReport.STATUS_ACCEPTED) {
            // 举报成立：先下线留言，再把同一条留言下其它待处理举报一并标记为成立
            this.update(Wrappers.<WallNote>lambdaUpdate()
                    .eq(WallNote::getId, report.getNoteId())
                    .set(WallNote::getStatus, WallNote.STATUS_HIDDEN)
                    .set(WallNote::getUpdateTime, now));
            wallNoteReportMapper.update(null, Wrappers.<WallNoteReport>lambdaUpdate()
                    .eq(WallNoteReport::getNoteId, report.getNoteId())
                    .eq(WallNoteReport::getStatus, WallNoteReport.STATUS_PENDING)
                    .ne(WallNoteReport::getId, reportId)
                    .set(WallNoteReport::getStatus, WallNoteReport.STATUS_ACCEPTED)
                    .set(WallNoteReport::getHandleTime, now));
            return;
        }

        // 举报不成立：如果这是最后一条待处理举报，且留言是「被举报自动隐藏」的，就把它放回去
        Long pending = wallNoteReportMapper.selectCount(Wrappers.<WallNoteReport>lambdaQuery()
                .eq(WallNoteReport::getNoteId, report.getNoteId())
                .eq(WallNoteReport::getStatus, WallNoteReport.STATUS_PENDING));
        if (pending != null && pending > 0) {
            return;
        }
        WallNote note = this.getById(report.getNoteId());
        if (note == null
                || !Integer.valueOf(WallNote.STATUS_HIDDEN).equals(note.getStatus())
                || !WallNote.AUTO_HIDE_REMARK.equals(note.getAuditRemark())) {
            return;
        }
        double posX = note.getPosX() == null ? (WallLayout.CANVAS_WIDTH - WallLayout.PAPER_WIDTH) / 2 : note.getPosX();
        double posY = note.getPosY() == null ? (WallLayout.CANVAS_HEIGHT - WallLayout.PAPER_HEIGHT) / 2 : note.getPosY();
        WallLayout.Point position = WallLayout.place(posX, posY, occupied(note.getId()));
        if (position == null) {
            log.warn("留言 {} 举报不成立，但墙面已满，暂时保持隐藏", note.getId());
            return;
        }
        this.update(Wrappers.<WallNote>lambdaUpdate()
                .eq(WallNote::getId, note.getId())
                .set(WallNote::getStatus, WallNote.STATUS_VISIBLE)
                .set(WallNote::getAuditRemark, null)
                .set(WallNote::getPosX, position.x())
                .set(WallNote::getPosY, position.y())
                // 举报被判定不成立，计数从零开始，避免一封误报反复触发自动隐藏
                .set(WallNote::getReportCount, 0)
                .set(WallNote::getUpdateTime, now));
    }

    /* ================================================================== 私有辅助 */

    private boolean isEnabled() {
        String value = siteConfigService.getValue(CFG_ENABLED, "1");
        return "1".equals(value) || "true".equalsIgnoreCase(value);
    }

    private void checkEnabled() {
        if (!isEnabled()) {
            throw new BusinessException(ResultCode.WALL_DISABLED);
        }
    }

    private int maxLength() {
        return Math.min(Math.max(1, intConfig(CFG_MAX_LENGTH, DEFAULT_MAX_LENGTH)), CONTENT_COLUMN_LENGTH);
    }

    private int maxNotes() {
        return Math.max(1, intConfig(CFG_MAX_NOTES, DEFAULT_MAX_NOTES));
    }

    private int reportThreshold() {
        return Math.max(0, intConfig(CFG_REPORT_THRESHOLD, DEFAULT_REPORT_THRESHOLD));
    }

    private int dailyLimit() {
        return Math.max(1, intConfig(CFG_DAILY_LIMIT, DEFAULT_DAILY_LIMIT));
    }

    private int intConfig(String key, int defaultValue) {
        String value = siteConfigService.getValue(key, null);
        if (!StringUtils.hasText(value)) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            log.warn("留言墙配置 {} 不是合法数字：{}，使用默认值 {}", key, value, defaultValue);
            return defaultValue;
        }
    }

    /**
     * 读取色板。配置是 JSON 数组；解析失败时退回内置的 6 色，保证前端永远拿得到颜色。
     */
    private List<WallColorVO> palette() {
        String json = siteConfigService.getValue(CFG_PALETTE, null);
        if (!StringUtils.hasText(json)) {
            return DEFAULT_PALETTE;
        }
        try {
            WallColorVO[] colors = JSON_MAPPER.readValue(json, WallColorVO[].class);
            if (colors != null) {
                List<WallColorVO> parsed = Arrays.stream(colors)
                        .filter(item -> item != null && StringUtils.hasText(item.getKey()))
                        .collect(Collectors.toList());
                if (!parsed.isEmpty()) {
                    return parsed;
                }
            }
        } catch (Exception e) {
            log.warn("留言墙色板配置解析失败，使用默认色板：{}", e.getMessage());
        }
        return DEFAULT_PALETTE;
    }

    private String checkColor(String color, List<WallColorVO> palette) {
        String value = StringUtils.hasText(color) ? color.trim() : null;
        for (WallColorVO item : palette) {
            if (item.getKey() != null && item.getKey().equals(value)) {
                return value;
            }
        }
        if (value == null && !palette.isEmpty()) {
            return palette.get(0).getKey();
        }
        throw new BusinessException(ResultCode.PARAM_ERROR, "请选择信纸颜色");
    }

    private String checkContent(String raw, int maxLength) {
        if (!StringUtils.hasText(raw)) {
            throw new BusinessException(ResultCode.WALL_NOTE_CONTENT_EMPTY);
        }
        String content = raw.replace("\r\n", "\n").replace('\r', '\n').trim();
        // 去掉除换行外的控制字符，避免零宽字符、终端控制序列混进正文
        content = content.replaceAll("[\\p{Cntrl}&&[^\\n]]", "");
        // 连续空行压成一行，信纸高度固定，留太多空行会顶掉正文
        content = content.replaceAll("\\n{3,}", "\n\n");
        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ResultCode.WALL_NOTE_CONTENT_EMPTY);
        }
        int length = content.codePointCount(0, content.length());
        if (length > maxLength) {
            throw new BusinessException(ResultCode.WALL_NOTE_CONTENT_TOO_LONG,
                    "留言最多 " + maxLength + " 个字");
        }
        return content;
    }

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
     * 发布频率限制：30 秒内同一内容只收一次，每人每天有上限。
     * Redis 不可用时降级为「不限制」，不能因为缓存挂了就不让留言。
     */
    private void checkPublishLimit(Long userId, String content) {
        try {
            String coolKey = "wall:cool:" + userId + ":" + content.hashCode();
            Boolean first = stringRedisTemplate.opsForValue()
                    .setIfAbsent(coolKey, "1", Duration.ofSeconds(PUBLISH_COOLDOWN_SECONDS));
            if (Boolean.FALSE.equals(first)) {
                throw new BusinessException(ResultCode.WALL_NOTE_TOO_FREQUENT);
            }

            int limit = dailyLimit();
            String dailyKey = "wall:daily:" + userId + ":" + LocalDate.now();
            Long count = stringRedisTemplate.opsForValue().increment(dailyKey);
            if (count != null && count == 1L) {
                stringRedisTemplate.expire(dailyKey, Duration.ofDays(2));
            }
            if (count != null && count > limit) {
                stringRedisTemplate.opsForValue().decrement(dailyKey);
                throw new BusinessException(ResultCode.WALL_NOTE_DAILY_LIMIT);
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("留言墙限流检查失败，本次放行：{}", e.getMessage());
        }
    }

    private WallNote getExisting(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.WALL_NOTE_NOT_FOUND);
        }
        WallNote note = this.getById(id);
        if (note == null) {
            throw new BusinessException(ResultCode.WALL_NOTE_NOT_FOUND);
        }
        return note;
    }

    /**
     * 当前占位的信纸：只算「已通过 + 显示中」的，待审核与隐藏的不占位。
     */
    private List<WallLayout.Rect> occupied(Long excludeId) {
        List<WallNote> notes = this.list(Wrappers.<WallNote>lambdaQuery()
                .select(WallNote::getId, WallNote::getPosX, WallNote::getPosY)
                .eq(WallNote::getAuditStatus, WallNote.AUDIT_APPROVED)
                .eq(WallNote::getStatus, WallNote.STATUS_VISIBLE)
                .ne(excludeId != null, WallNote::getId, excludeId));
        List<WallLayout.Rect> rects = new ArrayList<>(notes.size());
        for (WallNote note : notes) {
            if (note.getPosX() != null && note.getPosY() != null) {
                rects.add(new WallLayout.Rect(note.getPosX(), note.getPosY()));
            }
        }
        return rects;
    }

    private long versionOf(List<WallNote> notes) {
        long version = 0L;
        for (WallNote note : notes) {
            if (note.getUpdateTime() == null) {
                continue;
            }
            long millis = note.getUpdateTime().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
            if (millis > version) {
                version = millis;
            }
        }
        return version;
    }

    private double randomRotation() {
        double value = ThreadLocalRandom.current().nextDouble(-5.0, 5.0);
        return Math.round(value * 10) / 10.0;
    }

    private WallNoteVO toVO(WallNote note, Long currentUserId) {
        WallNoteVO vo = new WallNoteVO();
        BeanUtils.copyProperties(note, vo);
        vo.setOwned(currentUserId != null && currentUserId.equals(note.getUserId()));
        vo.setPending(!Integer.valueOf(WallNote.AUDIT_APPROVED).equals(note.getAuditStatus()));
        return vo;
    }

    private WallNoteAdminVO toAdminVO(WallNote note) {
        WallNoteAdminVO vo = new WallNoteAdminVO();
        BeanUtils.copyProperties(note, vo);
        return vo;
    }

    private static WallColorVO color(String key, String label, String color) {
        WallColorVO vo = new WallColorVO();
        vo.setKey(key);
        vo.setLabel(label);
        vo.setColor(color);
        return vo;
    }
}
