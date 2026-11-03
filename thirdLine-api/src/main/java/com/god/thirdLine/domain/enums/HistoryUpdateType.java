package com.god.thirdLine.domain.enums;

import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.exception.BusinessException;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum HistoryUpdateType {
    FEATURE(0, "新增功能"),
    IMPROVEMENT(1, "功能优化"),
    FIX(2, "问题修复");

    private final Integer code;
    private final String label;

    public static HistoryUpdateType fromCode(Integer code) {
        return Arrays.stream(values()).filter(value -> value.code.equals(code)).findFirst()
                .orElseThrow(() -> new BusinessException(ResultCode.PARAM_ERROR, "更新类型不合法"));
    }
}

