package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 与页面人物对话请求参数
 *
 * @author ParlisJade
 */
@Data
public class ChatDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 用户发送的内容，必填 */
    private String message;
}
