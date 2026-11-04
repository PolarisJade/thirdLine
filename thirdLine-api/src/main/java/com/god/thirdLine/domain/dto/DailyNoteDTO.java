package com.god.thirdLine.domain.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DailyNoteDTO {
    private Long id;
    private LocalDate noteDate;
    private String content;
    private Integer mood;
    private Integer weather;
    private Integer publishStatus;
}
