package com.god.thirdLine.domain.vo;

import java.time.LocalDate;

/** 公开记录不包含后台发布、显隐及审计字段。 */
public record SiteHistoryVO(Long id, String description, LocalDate updateDate,
                            String version, Integer updateType, String updateTypeLabel) {}

