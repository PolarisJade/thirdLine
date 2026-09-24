package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.PortfolioDTO;
import com.god.thirdLine.domain.query.PortfolioQuery;
import com.god.thirdLine.domain.vo.PortfolioVO;
import com.god.thirdLine.service.IPortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 作品集表 后台管理控制器
 * </p>
 * 位于 /admin/** 命名空间，读写操作均经 JWT 拦截器校验登录。
 *
 * @author ParlisJade
 * @since 2026-09-24
 */
@RestController
@RequestMapping("/admin/portfolio")
@RequiredArgsConstructor
public class AdminPortfolioController {

    private final IPortfolioService portfolioService;

    /**
     * 分页查询作品（可按状态 / 关键词过滤，含草稿）
     */
    @GetMapping("/page")
    public Result<PageResult<PortfolioVO>> page(PortfolioQuery query) {
        return Result.success(portfolioService.pagePortfolios(query));
    }

    /**
     * 根据ID查询作品详情（编辑回填用）
     */
    @GetMapping("/{id}")
    public Result<PortfolioVO> detail(@PathVariable Long id) {
        return Result.success(portfolioService.getPortfolioDetail(id));
    }

    /**
     * 新增作品
     */
    @PostMapping
    public Result<Long> save(@RequestBody PortfolioDTO dto) {
        return Result.success(portfolioService.savePortfolio(dto));
    }

    /**
     * 修改作品
     */
    @PutMapping
    public Result<Void> update(@RequestBody PortfolioDTO dto) {
        portfolioService.updatePortfolio(dto);
        return Result.success();
    }

    /**
     * 删除作品
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        portfolioService.deletePortfolio(id);
        return Result.success();
    }
}
