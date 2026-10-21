package com.god.thirdLine.controller.user;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.config.JwtProperties;
import com.god.thirdLine.context.UserContext;
import com.god.thirdLine.domain.dto.WallNoteCreateDTO;
import com.god.thirdLine.domain.dto.WallNoteMoveDTO;
import com.god.thirdLine.domain.dto.WallNoteReportDTO;
import com.god.thirdLine.domain.vo.WallConfigVO;
import com.god.thirdLine.domain.vo.WallListVO;
import com.god.thirdLine.domain.vo.WallMoveResultVO;
import com.god.thirdLine.domain.vo.WallNoteVO;
import com.god.thirdLine.service.IWallNoteService;
import com.god.thirdLine.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
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
 * 留言墙 前台控制器。
 *
 * <p>读接口（配置、整面墙）匿名可访问；写接口（提交、移动、删除、举报）
 * 由 {@code UserJwtInterceptor} 强制登录，必须携带有效用户 token。</p>
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@RestController
@RequestMapping("/user/wall")
@RequiredArgsConstructor
public class WallController {

    private final IWallNoteService wallNoteService;
    private final JwtUtil jwtUtil;
    private final JwtProperties jwtProperties;

    /**
     * 墙面配置：画布尺寸、信纸尺寸、色板、须知、开关。
     * 前端用它渲染画布、计算拖动坐标，保证和服务端的裁决参数一致。
     */
    @GetMapping("/config")
    public Result<WallConfigVO> config() {
        return Result.success(wallNoteService.getConfig());
    }

    /**
     * 整面墙的可见留言。
     * 带了登录 token 时，返回的每条留言会带 owned 标记（只表示是不是自己贴的）。
     */
    @GetMapping("/list")
    public Result<WallListVO> list(HttpServletRequest request) {
        Long currentUserId = jwtUtil.resolveUserIdOrNull(request.getHeader(jwtProperties.getHeader()));
        return Result.success(wallNoteService.listVisible(currentUserId));
    }

    /**
     * 提交留言：落库后为待审核，审核通过才会出现在墙上。
     */
    @PostMapping("/note")
    public Result<WallNoteVO> create(@RequestBody WallNoteCreateDTO dto) {
        return Result.success(wallNoteService.create(dto, UserContext.getUserId()));
    }

    /**
     * 拖动后点「√」：确认新位置，服务端重新做防重叠裁决。
     */
    @PutMapping("/note/{id}/position")
    public Result<WallMoveResultVO> move(@PathVariable Long id, @RequestBody WallNoteMoveDTO dto) {
        return Result.success(wallNoteService.move(id, dto, UserContext.getUserId()));
    }

    /**
     * 作者删除自己的留言（逻辑删除）。
     */
    @DeleteMapping("/note/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        wallNoteService.delete(id, UserContext.getUserId());
        return Result.success();
    }

    /**
     * 举报留言。
     */
    @PostMapping("/note/{id}/report")
    public Result<Void> report(@PathVariable Long id, @RequestBody WallNoteReportDTO dto) {
        wallNoteService.report(id, dto, UserContext.getUserId());
        return Result.success();
    }
}
