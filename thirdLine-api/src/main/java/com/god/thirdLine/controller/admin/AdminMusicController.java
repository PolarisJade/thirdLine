package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.dto.MusicDTO;
import com.god.thirdLine.domain.query.MusicQuery;
import com.god.thirdLine.domain.vo.MusicVO;
import com.god.thirdLine.service.IMusicService;
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
 * 音乐表 后台管理控制器
 * </p>
 * 位于 /admin/** 命名空间，读写操作均经 JWT 拦截器校验登录。
 *
 * @author ParlisJade
 * @since 2026-10-01
 */
@RestController
@RequestMapping("/admin/music")
@RequiredArgsConstructor
public class AdminMusicController {

    private final IMusicService musicService;

    /**
     * 分页查询音乐（可按状态 / 关键词过滤，含已下架）
     */
    @GetMapping("/page")
    public Result<PageResult<MusicVO>> page(MusicQuery query) {
        return Result.success(musicService.pageMusics(query));
    }

    /**
     * 根据ID查询音乐详情（编辑回填用）
     */
    @GetMapping("/{id}")
    public Result<MusicVO> detail(@PathVariable Long id) {
        return Result.success(musicService.getMusicDetail(id));
    }

    /**
     * 新增音乐
     */
    @PostMapping
    public Result<Long> save(@RequestBody MusicDTO dto) {
        return Result.success(musicService.saveMusic(dto));
    }

    /**
     * 修改音乐
     */
    @PutMapping
    public Result<Void> update(@RequestBody MusicDTO dto) {
        musicService.updateMusic(dto);
        return Result.success();
    }

    /**
     * 删除音乐
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        musicService.deleteMusic(id);
        return Result.success();
    }
}
