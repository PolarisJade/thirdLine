package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.*;
import com.god.thirdLine.domain.dto.SiteHistoryDTO;
import com.god.thirdLine.domain.query.SiteHistoryQuery;
import com.god.thirdLine.domain.vo.*;
import com.god.thirdLine.service.ISiteHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/site-history")
@RequiredArgsConstructor
public class AdminSiteHistoryController {
    private final ISiteHistoryService service;

    @GetMapping("/page")
    public Result<PageResult<SiteHistoryAdminVO>> page(SiteHistoryQuery query) {
        return Result.success(service.page(query));
    }

    @GetMapping("/options")
    public Result<SiteHistoryOptionsVO> options() { return Result.success(service.options()); }

    @PostMapping
    public Result<Long> create(@RequestBody SiteHistoryDTO dto) { return Result.success(service.create(dto)); }

    @PutMapping
    public Result<Void> update(@RequestBody SiteHistoryDTO dto) {
        service.update(dto);
        return Result.success();
    }

    @PutMapping("/{id}/publish-status")
    public Result<Void> publishStatus(@PathVariable Long id, @RequestParam Integer publishStatus) {
        service.changePublishStatus(id, publishStatus);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    public Result<Void> status(@PathVariable Long id, @RequestParam Integer status) {
        service.changeStatus(id, status);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return Result.success();
    }
}

