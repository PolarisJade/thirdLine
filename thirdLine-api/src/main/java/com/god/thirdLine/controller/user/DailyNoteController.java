package com.god.thirdLine.controller.user;

import com.god.thirdLine.common.*;
import com.god.thirdLine.domain.query.DailyNoteQuery;
import com.god.thirdLine.domain.vo.DailyNoteVO;
import com.god.thirdLine.domain.vo.DailyNoteDateVO;
import java.util.List;
import com.god.thirdLine.service.impl.DailyNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/daily-note")
@RequiredArgsConstructor
public class DailyNoteController {
    private final DailyNoteService service;
    @GetMapping("/dates")
    public Result<List<DailyNoteDateVO>> dates() { return Result.success(service.dates()); }
    @GetMapping("/{id}")
    public Result<DailyNoteVO> detail(@PathVariable Long id) { return Result.success(service.publishedDetail(id)); }
    @GetMapping("/page")
    public Result<PageResult<DailyNoteVO>> page(DailyNoteQuery query) { return Result.success(service.page(query, false)); }
}
