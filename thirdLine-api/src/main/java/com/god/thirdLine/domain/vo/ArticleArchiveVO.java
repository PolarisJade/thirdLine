package com.god.thirdLine.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

/**
 * 文章日期归档：同一天发布的文章归为一组。
 */
@Data
public class ArticleArchiveVO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private LocalDate date;

    private List<ArticleArchiveEntryVO> articles;
}
