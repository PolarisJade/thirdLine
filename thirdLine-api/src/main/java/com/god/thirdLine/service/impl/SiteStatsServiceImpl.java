package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.god.thirdLine.config.HostProperties;
import com.god.thirdLine.domain.entity.Article;
import com.god.thirdLine.domain.entity.Photo;
import com.god.thirdLine.domain.vo.SiteProfileVO;
import com.god.thirdLine.domain.vo.SiteStatsVO;
import com.god.thirdLine.mapper.ArticleMapper;
import com.god.thirdLine.mapper.CategoryMapper;
import com.god.thirdLine.mapper.PhotoMapper;
import com.god.thirdLine.mapper.TagMapper;
import com.god.thirdLine.service.ISiteStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 网站基本信息统计 服务实现
 *
 * @author ParlisJade
 */
@Service
@RequiredArgsConstructor
public class SiteStatsServiceImpl implements ISiteStatsService {

    /** 文章状态：已发布 */
    private static final int ARTICLE_STATUS_PUBLISHED = 1;

    /** 照片状态：显示 */
    private static final int PHOTO_STATUS_VISIBLE = 1;

    private final ArticleMapper articleMapper;
    private final CategoryMapper categoryMapper;
    private final TagMapper tagMapper;
    private final PhotoMapper photoMapper;
    private final HostProperties hostProperties;

    @Override
    public SiteStatsVO getSiteStats() {
        SiteStatsVO vo = new SiteStatsVO();
        vo.setArticleCount(articleMapper.selectCount(
                new LambdaQueryWrapper<Article>()
                        .eq(Article::getStatus, ARTICLE_STATUS_PUBLISHED)));
        vo.setCategoryCount(categoryMapper.selectCount(null));
        vo.setTagCount(tagMapper.selectCount(null));
        vo.setPhotoCount(photoMapper.selectCount(
                new LambdaQueryWrapper<Photo>()
                        .eq(Photo::getStatus, PHOTO_STATUS_VISIBLE)));
        return vo;
    }

    @Override
    public SiteProfileVO getSiteProfile() {
        SiteProfileVO vo = new SiteProfileVO();
        vo.setNickname(hostProperties.getNickname());
        vo.setEmail(hostProperties.getEmail());
        vo.setGithub(hostProperties.getGithub());
        vo.setAvatar(hostProperties.getAvatar());
        return vo;
    }
}