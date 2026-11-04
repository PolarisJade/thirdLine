package com.god.thirdLine.domain.vo;

import java.time.LocalDate;

/** 前台时间目录，不加载正文。 */
public record DailyNoteDateVO(Long id, LocalDate noteDate) {}
