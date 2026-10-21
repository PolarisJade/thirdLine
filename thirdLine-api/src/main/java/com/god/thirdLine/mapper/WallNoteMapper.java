package com.god.thirdLine.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.god.thirdLine.domain.entity.WallNote;
import org.apache.ibatis.annotations.Mapper;

/**
 * 留言墙-留言 Mapper
 *
 * @author ParlisJade
 * @since 2026-10-21
 */
@Mapper
public interface WallNoteMapper extends BaseMapper<WallNote> {
}
