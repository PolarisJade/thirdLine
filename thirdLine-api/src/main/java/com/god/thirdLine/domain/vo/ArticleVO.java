package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 文章展示对象
 *
 * @author ParlisJade
 */
@Data
public class ArticleVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    private String title;

    /** 正文，列表查询时可为空，详情查询时返回 */
    private String content;

    private String summary;

    private String coverImage;

    private Long authorId;

    /** 作者昵称 */
    private String authorName;

    private Long categoryId;

    /** 分类名称 */
    private String categoryName;

    private Integer isTop;

    private Integer isOriginal;

    private Integer status;

    private LocalDateTime publishedTime;

    private LocalDateTime createdTime;

    private LocalDateTime updatedTime;

    /** 关联标签 */
    private List<TagVO> tags;
}
