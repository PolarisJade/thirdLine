package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.WallNoteAuditDTO;
import com.god.thirdLine.domain.dto.WallReportHandleDTO;
import com.god.thirdLine.domain.query.WallNoteQuery;
import com.god.thirdLine.domain.query.WallReportQuery;
import com.god.thirdLine.domain.vo.WallNoteAdminVO;
import com.god.thirdLine.domain.vo.WallReportAdminVO;
import com.god.thirdLine.service.IWallNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 留言墙 后台管理控制器。
 *
 * <p>位于 /admin/** 命名空间，由 JwtInterceptor 强制校验管理员身份。</p>
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@RestController
@RequestMapping("/admin/wall")
@RequiredArgsConstructor
public class AdminWallController {

    private final IWallNoteService wallNoteService;

    /**
     * 留言分页：待审核排最前，可按审核状态 / 显示状态 / 关键词过滤。
     */
    @GetMapping("/note/page")
    public Result<PageResult<WallNoteAdminVO>> pageNotes(WallNoteQuery query) {
        return Result.success(wallNoteService.pageNotes(query));
    }

    /**
     * 审核：1通过 / 2拒绝（拒绝需填写原因）。
     * 通过时会重新计算位置，避免与后来上墙的信纸重叠。
     */
    @PutMapping("/note/{id}/audit")
    public Result<Void> audit(@PathVariable Long id, @RequestBody WallNoteAuditDTO dto) {
        wallNoteService.audit(id, dto);
        return Result.success();
    }

    /**
     * 显示 / 隐藏：0隐藏 1显示。重新显示时同样会重新落位。
     */
    @PutMapping("/note/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam("status") Integer status) {
        wallNoteService.updateStatus(id, status);
        return Result.success();
    }

    /**
     * 删除留言（逻辑删除）。
     */
    @DeleteMapping("/note/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        wallNoteService.adminDelete(id);
        return Result.success();
    }

    /**
     * 举报分页：待处理排最前。
     */
    @GetMapping("/report/page")
    public Result<PageResult<WallReportAdminVO>> pageReports(WallReportQuery query) {
        return Result.success(wallNoteService.pageReports(query));
    }

    /**
     * 处理举报：1成立（下线留言） / 2不成立（若是最后一条待处理举报且留言是被自动隐藏的，会恢复显示）。
     */
    @PutMapping("/report/{id}/handle")
    public Result<Void> handleReport(@PathVariable Long id, @RequestBody WallReportHandleDTO dto) {
        wallNoteService.handleReport(id, dto);
        return Result.success();
    }
}
