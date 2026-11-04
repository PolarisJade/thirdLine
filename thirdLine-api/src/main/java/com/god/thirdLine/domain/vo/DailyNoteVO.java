package com.god.thirdLine.domain.vo;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DailyNoteVO(Long id, LocalDate noteDate, String content, Integer mood, Integer weather,
                          Integer publishStatus, LocalDateTime publishTime, LocalDateTime createTime,
                          LocalDateTime updateTime) {}
