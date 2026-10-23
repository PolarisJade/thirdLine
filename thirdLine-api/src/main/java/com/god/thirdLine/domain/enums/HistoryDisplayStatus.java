package com.god.thirdLine.domain.enums;

import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.exception.BusinessException;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum HistoryDisplayStatus {
    HIDDEN(0, "隐藏"),
    VISIBLE(1, "显示");

    private final Integer code;
    private final String label;

    public static HistoryDisplayStatus fromCode(Integer code) {
        return Arrays.stream(values()).filter(value -> value.code.equals(code)).findFirst()
                .orElseThrow(() -> new BusinessException(ResultCode.PARAM_ERROR, "展示状态不合法"));
    }
}

