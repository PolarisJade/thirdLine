package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 发送弹幕请求参数
 *
 * @author ParlisJade
 */
@Data
public class DanmakuSendDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 弹幕内容，必填，最长 100 字符 */
    private String content;

    /** 文字颜色，如 #FFFFFF，留空默认白色 */
    private String color;
}
