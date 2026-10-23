package com.god.thirdLine.domain.enums;

import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.exception.BusinessException;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum HistoryPublishStatus {
    DRAFT(0, "草稿"),
    PUBLISHED(1, "已发布");

    private final Integer code;
    private final String label;

    public static HistoryPublishStatus fromCode(Integer code) {
        return Arrays.stream(values()).filter(value -> value.code.equals(code)).findFirst()
                .orElseThrow(() -> new BusinessException(ResultCode.PARAM_ERROR, "发布状态不合法"));
    }
}

