package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.TechStackDTO;
import com.god.thirdLine.domain.vo.TechStackVO;
import com.god.thirdLine.service.ITechStackService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * <p>
 * 技术栈字典 后台管理控制器
 * </p>
 * 位于 /admin/** 命名空间，读写操作均经 JWT 拦截器校验管理员身份。
 *
 * @author ParlisJade
 * @since 2026-10-12
 */
@RestController
@RequestMapping("/admin/tech-stack")
@RequiredArgsConstructor
public class AdminTechStackController {

    private final ITechStackService techStackService;

    /**
     * 查询全部技术栈（含禁用项）
     */
    @GetMapping("/list")
    public Result<List<TechStackVO>> list() {
        return Result.success(techStackService.listTechStacks());
    }

    /**
     * 新增技术栈
     */
    @PostMapping
    public Result<Long> save(@RequestBody TechStackDTO dto) {
        return Result.success(techStackService.saveTechStack(dto));
    }

    /**
     * 修改技术栈（名称 / 排序 / 状态）
     */
    @PutMapping
    public Result<Void> update(@RequestBody TechStackDTO dto) {
        techStackService.updateTechStack(dto);
        return Result.success();
    }

    /**
     * 删除技术栈（存在关联作品时不可删除）
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        techStackService.deleteTechStack(id);
        return Result.success();
    }
}
