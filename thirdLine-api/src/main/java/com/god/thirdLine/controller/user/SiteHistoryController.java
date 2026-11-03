package com.god.thirdLine.controller.user;

import com.god.thirdLine.common.Result;
import com.god.thirdLine.domain.vo.SiteHistoryVO;
import com.god.thirdLine.service.ISiteHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/user/site-history")
@RequiredArgsConstructor
public class SiteHistoryController {
    private final ISiteHistoryService service;

    @GetMapping("/list")
    public Result<List<SiteHistoryVO>> list() { return Result.success(service.listPublished()); }
}

