package com.god.thirdLine.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.god.thirdLine.domain.entity.FriendLink;

/**
 * <p>
 * 友情链接表 Mapper 接口
 * </p>
 * 查询均为单表条件查询，MyBatis-Plus 的 lambdaQuery 足够，无需自定义 XML。
 *
 * @author ParlisJade
 * @since 2026-10-17
 */
public interface FriendLinkMapper extends BaseMapper<FriendLink> {

}
