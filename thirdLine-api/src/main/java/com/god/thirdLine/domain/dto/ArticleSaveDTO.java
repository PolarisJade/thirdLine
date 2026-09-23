package com.god.thirdLine.domain.dto;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 新增文章请求参数（作者ID取自登录态）
 *
 * @author ParlisJade
 */
@Data
public class ArticleSaveDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 文章标题 */
    private String title;

    /** 正文 */
    private String content;

    /** 文章摘要 */
    private String summary;

    /** 封面图URL */
    private String coverImage;

    /** 分类ID（必填） */
    private Long categoryId;

    /** 是否置顶：0否/1是 */
    private Integer isTop;

    /** 是否原创：0转载/1原创 */
    private Integer isOriginal;

    /** 状态：0草稿/1已发布 */
    private Integer status;

    /** 关联标签ID集合 */
    private List<Long> tagIds;
}
