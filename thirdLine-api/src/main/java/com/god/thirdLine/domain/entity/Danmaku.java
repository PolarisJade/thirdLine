package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * <p>
 * 弹幕表
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-27
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_danmaku")
public class Danmaku implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 发送用户ID，关联tl_user.id（需登录）
     */
    private Long userId;

    /**
     * 弹幕内容，限短文本
     */
    private String content;

    /**
     * 文字颜色，如 #FF6699
     */
    private String color;

    /**
     * 状态：0隐藏 1显示（管理员下架兜底）
     */
    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
