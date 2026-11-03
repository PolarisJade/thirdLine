package com.god.thirdLine.domain.vo;

import java.util.List;

public record SiteHistoryOptionsVO(List<Option> updateTypes, List<Option> publishStatuses, List<Option> statuses) {
    public record Option(Integer value, String label) {}
}

