package com.god.thirdLine.domain.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SiteHistoryDTO {
    private Long id;
    private String description;
    private LocalDate updateDate;
    private String version;
    private Integer updateType;
    private Integer publishStatus;
    private Integer status;
}

