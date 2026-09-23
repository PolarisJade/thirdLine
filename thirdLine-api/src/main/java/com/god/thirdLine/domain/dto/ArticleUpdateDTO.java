package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 修改文章请求参数
 *
 * @author ParlisJade
 */
@Data
public class ArticleUpdateDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 文章ID（必填） */
    private Long id;

    /** 文章标题 */
    private String title;

    /** 正文 */
    private String content;

    /** 文章摘要 */
    private String summary;

    /** 封面图URL */
    private String coverImage;

    /** 分类ID */
    private Long categoryId;

    /** 是否置顶：0否/1是 */
    private Integer isTop;

    /** 是否原创：0转载/1原创 */
    private Integer isOriginal;

    /** 状态：0草稿/1已发布/2已删除 */
    private Integer status;

    /** 关联标签ID集合，非 null 时将整体覆盖原有标签关联 */
    private List<Long> tagIds;
}
