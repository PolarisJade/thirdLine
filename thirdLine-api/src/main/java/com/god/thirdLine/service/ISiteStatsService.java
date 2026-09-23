package com.god.thirdLine.service;

import com.god.thirdLine.domain.vo.SiteStatsVO;

/**
 * 网站基本信息统计 服务类
 *
 * @author ParlisJade
 */
public interface ISiteStatsService {

    /**
     * 查询网站基本信息：文章总数 / 分类总数 / 标签总数
     */
    SiteStatsVO getSiteStats();
}