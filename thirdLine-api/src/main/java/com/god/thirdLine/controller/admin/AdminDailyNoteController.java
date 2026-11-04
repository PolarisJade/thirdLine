package com.god.thirdLine.controller.admin;

import com.god.thirdLine.common.*;
import com.god.thirdLine.domain.dto.DailyNoteDTO;
import com.god.thirdLine.domain.query.DailyNoteQuery;
import com.god.thirdLine.domain.vo.DailyNoteVO;
import com.god.thirdLine.service.impl.DailyNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/daily-note")
@RequiredArgsConstructor
public class AdminDailyNoteController {
    private final DailyNoteService service;
    @GetMapping("/page")
    public Result<PageResult<DailyNoteVO>> page(DailyNoteQuery query) { return Result.success(service.page(query, true)); }
    @PostMapping
    public Result<Long> create(@RequestBody DailyNoteDTO dto) { return Result.success(service.save(dto, false)); }
    @PutMapping
    public Result<Void> update(@RequestBody DailyNoteDTO dto) { service.save(dto, true); return Result.success(); }
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) { service.delete(id); return Result.success(); }
}
