package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/** 归档目录只返回标题、分类与发布时间，不加载正文和封面等详情。 */
@Data
public class ArticleArchiveEntryVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;

    private String title;

    private String categoryName;

    private LocalDateTime publishedTime;
}
