package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.FootprintDTO;
import com.god.thirdLine.domain.query.FootprintQuery;
import com.god.thirdLine.domain.vo.FootprintAdminVO;
import com.god.thirdLine.domain.vo.FootprintCityOptionVO;
import com.god.thirdLine.service.IFootprintService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 足迹城市后台管理。
 * 位于 /admin/** 命名空间，读写操作均经 JWT 拦截器校验管理员身份。
 *
 * @author ParlisJade
 */
@RestController
@RequestMapping("/admin/footprint")
@RequiredArgsConstructor
public class AdminFootprintController {

    private final IFootprintService footprintService;

    @GetMapping("/page")
    public Result<PageResult<FootprintAdminVO>> page(FootprintQuery query) {
        return Result.success(footprintService.page(query));
    }

    /** 城市下拉选项：后台相册录入照片时选择所属城市 */
    @GetMapping("/options")
    public Result<List<FootprintCityOptionVO>> options() {
        return Result.success(footprintService.options());
    }

    @PostMapping
    public Result<Long> create(@RequestBody FootprintDTO dto) {
        return Result.success(footprintService.create(dto));
    }

    @PutMapping
    public Result<Void> update(@RequestBody FootprintDTO dto) {
        footprintService.update(dto);
        return Result.success();
    }

    @PutMapping("/{id}/publish-status")
    public Result<Void> publishStatus(@PathVariable Long id, @RequestParam Integer publishStatus) {
        footprintService.changePublishStatus(id, publishStatus);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    public Result<Void> status(@PathVariable Long id, @RequestParam Integer status) {
        footprintService.changeStatus(id, status);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        footprintService.delete(id);
        return Result.success();
    }
}
