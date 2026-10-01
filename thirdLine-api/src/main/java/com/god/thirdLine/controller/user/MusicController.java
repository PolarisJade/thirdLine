package com.god.thirdLine.controller.user;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.vo.MusicVO;
import com.god.thirdLine.service.IMusicService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * <p>
 * 音乐表 前台公开控制器
 * </p>
 * 仅提供前台全局悬浮播放器所需的读接口，位于 /user/** 命名空间，不做登录校验；
 * 后台音乐管理（分页/增删改）见 {@code /admin/music}。
 *
 * @author ParlisJade
 * @since 2026-10-01
 */
@RestController
@RequestMapping("/user/music")
@RequiredArgsConstructor
public class MusicController {

    private final IMusicService musicService;

    /**
     * 查询全部已上架音乐，按排序权重升序（前台悬浮播放器拉取，读操作放行）
     */
    @GetMapping("/list")
    public Result<List<MusicVO>> list() {
        return Result.success(musicService.listEnabledMusics());
    }
}
