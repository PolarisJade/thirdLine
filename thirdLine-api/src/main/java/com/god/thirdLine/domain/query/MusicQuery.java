package com.god.thirdLine.domain.query;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 音乐分页查询条件（标准 page/size 分页）
 *
 * @author ParlisJade
 */
@Data
public class MusicQuery implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 页码，从 1 开始 */
    private Integer page = 1;

    /** 每页条数，默认 10，最大 100 */
    private Integer size = 10;

    /** 关键词：模糊匹配歌曲名 / 歌手 */
    private String keyword;

    /** 状态：0下架/1上架，为空则不限制 */
    private Integer status;

    public Integer getPage() {
        if (page == null || page <= 0) {
            return 1;
        }
        return page;
    }

    public Integer getSize() {
        if (size == null || size <= 0) {
            return 10;
        }
        return Math.min(size, 100);
    }
}
