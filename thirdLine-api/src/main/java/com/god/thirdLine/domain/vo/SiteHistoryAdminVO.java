package com.god.thirdLine.domain.vo;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SiteHistoryAdminVO(Long id, String description, LocalDate updateDate,
        String version, Integer updateType, String updateTypeLabel,
        Integer publishStatus, String publishStatusLabel, Integer status, String statusLabel,
        LocalDateTime createTime, LocalDateTime updateTime) {}

