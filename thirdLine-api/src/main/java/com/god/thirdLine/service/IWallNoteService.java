package com.god.thirdLine.service;

import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.domain.dto.WallNoteAuditDTO;
import com.god.thirdLine.domain.dto.WallNoteCreateDTO;
import com.god.thirdLine.domain.dto.WallNoteMoveDTO;
import com.god.thirdLine.domain.dto.WallNoteReportDTO;
import com.god.thirdLine.domain.dto.WallReportHandleDTO;
import com.god.thirdLine.domain.query.WallNoteQuery;
import com.god.thirdLine.domain.query.WallReportQuery;
import com.god.thirdLine.domain.vo.WallConfigVO;
import com.god.thirdLine.domain.vo.WallListVO;
import com.god.thirdLine.domain.vo.WallMoveResultVO;
import com.god.thirdLine.domain.vo.WallNoteAdminVO;
import com.god.thirdLine.domain.vo.WallNoteVO;
import com.god.thirdLine.domain.vo.WallReportAdminVO;

/**
 * 留言墙服务。
 *
 * <p>前台：读取配置、整面墙、提交留言、拖动确认位置、删除、举报；</p>
 * <p>后台：审核分页、通过/拒绝、显隐切换、删除、举报分页与处理。</p>
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
public interface IWallNoteService {

    /** 前台配置：画布尺寸、信纸尺寸、色板、须知、开关 */
    WallConfigVO getConfig();

    /** 整面墙的可见留言；currentUserId 用于标记 owned（可为 null） */
    WallListVO listVisible(Long currentUserId);

    /** 提交留言，落库后为待审核 */
    WallNoteVO create(WallNoteCreateDTO dto, Long userId);

    /** 拖动后确认位置，服务端做最终防重叠裁决 */
    WallMoveResultVO move(Long id, WallNoteMoveDTO dto, Long userId);

    /** 作者删除自己的留言（逻辑删除） */
    void delete(Long id, Long userId);

    /** 举报留言 */
    void report(Long id, WallNoteReportDTO dto, Long userId);

    /* ------------------------------------------------------------------ 后台 */

    PageResult<WallNoteAdminVO> pageNotes(WallNoteQuery query);

    void audit(Long id, WallNoteAuditDTO dto);

    void updateStatus(Long id, Integer status);

    void adminDelete(Long id);

    PageResult<WallReportAdminVO> pageReports(WallReportQuery query);

    void handleReport(Long reportId, WallReportHandleDTO dto);
}
