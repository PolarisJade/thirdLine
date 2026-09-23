package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.TagDTO;
import com.god.thirdLine.domain.vo.TagVO;
import com.god.thirdLine.service.ITagService;
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
 * 标签表 后台管理控制器
 * </p>
 * 位于 /admin/** 命名空间，读写操作均经 JWT 拦截器校验登录。
 *
 * @author ParlisJade
 * @since 2026-09-21
 */
@RestController
@RequestMapping("/admin/tag")
@RequiredArgsConstructor
public class AdminTagController {

    private final ITagService tagService;

    /**
     * 查询所有标签
     */
    @GetMapping("/list")
    public Result<List<TagVO>> list() {
        return Result.success(tagService.listTags());
    }

    /**
     * 新增标签
     */
    @PostMapping
    public Result<Long> save(@RequestBody TagDTO dto) {
        return Result.success(tagService.saveTag(dto));
    }

    /**
     * 修改标签名称
     */
    @PutMapping
    public Result<Void> update(@RequestBody TagDTO dto) {
        tagService.updateTag(dto);
        return Result.success();
    }

    /**
     * 删除标签（存在关联文章时不可删除）
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        tagService.deleteTag(id);
        return Result.success();
    }
}
