package com.god.thirdLine.controller.user;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.vo.FootprintVO;
import com.god.thirdLine.domain.vo.PhotoVO;
import com.god.thirdLine.service.IFootprintService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 足迹城市前台公开接口。
 * 位于 /user/** 命名空间，不做登录校验。
 *
 * @author ParlisJade
 */
@RestController
@RequestMapping("/user/footprint")
@RequiredArgsConstructor
public class FootprintController {

    private final IFootprintService footprintService;

    /** 地图高亮数据：已发布且显示的城市 */
    @GetMapping("/list")
    public Result<List<FootprintVO>> list() {
        return Result.success(footprintService.listPublished());
    }

    /** 点击城市后加载该城市下显示中的照片 */
    @GetMapping("/{cityCode}/photos")
    public Result<List<PhotoVO>> photos(@PathVariable String cityCode) {
        return Result.success(footprintService.listCityPhotos(cityCode));
    }
}
