package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 弹幕展示对象（前台滚动 & 后台列表复用）
 *
 * @author ParlisJade
 */
@Data
public class DanmakuVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 弹幕ID */
    private Long id;

    /** 发送用户ID */
    private Long userId;

    /** 发送者昵称（关联 tl_user 填充） */
    private String nickname;

    /** 弹幕内容 */
    private String content;

    /** 文字颜色 */
    private String color;

    /** 状态：0隐藏 1显示 */
    private Integer status;

    /** 累计被举报次数（仅后台列表使用） */
    private Integer reportCount;

    private LocalDateTime createTime;
}
