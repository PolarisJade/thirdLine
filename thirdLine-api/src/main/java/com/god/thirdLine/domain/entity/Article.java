package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;

import java.io.Serial;
import java.time.LocalDateTime;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * <p>
 * 文章表
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("tl_article")
public class Article implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 文章标题
     */
    private String title;

    /**
     * 正文
     */
    private String content;

    /**
     * 文章摘要
     */
    private String summary;

    /**
     * 封面图URL
     */
    private String coverImage;

    /**
     * 作者ID，关联tl_user
     */
    private Long authorId;

    /**
     * 分类ID，关联tl_category
     */
    private Long categoryId;

    /**
     * 是否置顶：0否/1是
     */
    private Integer isTop;

    /**
     * 是否原创：0转载/1原创
     */
    private Integer isOriginal;

    /**
     * 状态：0 草稿/1已发布/2已删除
     */
    private Integer status;

    /**
     * 发布时间
     */
    private LocalDateTime publishedTime;

    private LocalDateTime createdTime;

    private LocalDateTime updatedTime;


}
