package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.god.thirdLine.config.HostProperties;
import com.god.thirdLine.domain.entity.Article;
import com.god.thirdLine.domain.entity.Music;
import com.god.thirdLine.domain.entity.Photo;
import com.god.thirdLine.domain.entity.Portfolio;
import com.god.thirdLine.domain.entity.User;
import com.god.thirdLine.mapper.ArticleMapper;
import com.god.thirdLine.mapper.MusicMapper;
import com.god.thirdLine.mapper.PhotoMapper;
import com.god.thirdLine.mapper.PortfolioMapper;
import com.god.thirdLine.mapper.UserMapper;
import com.god.thirdLine.service.IOssReferenceService;
import com.god.thirdLine.util.ObjectStorageUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * OSS 文件引用检查与旧文件清理实现。
 *
 * <p>判断"还有没有人在用"时以数据库为准，逐处比对（顺序：配置 → 文章 → 相册 → 作品 → 音乐 → 用户）。
 * 这些查询一律不过滤 status，因为草稿、隐藏、下架的记录重新启用后仍会用到同一张图，
 * 保守一点只会漏删，不会误删。</p>
 *
 * @author ParlisJade
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OssReferenceServiceImpl implements IOssReferenceService {

    /** 富文本里出现的 http(s) 地址：排除引号、尖括号、括号、空白以及常见的收尾标点 */
    private static final Pattern URL_PATTERN = Pattern.compile("https?://[^\\s\"'<>()\\\\,;]+");

    private final ArticleMapper articleMapper;
    private final PhotoMapper photoMapper;
    private final PortfolioMapper portfolioMapper;
    private final MusicMapper musicMapper;
    private final UserMapper userMapper;
    private final HostProperties hostProperties;
    private final ObjectStorageUtil objectStorageUtil;

    @Override
    public boolean isReferenced(String url) {
        if (!StringUtils.hasText(url)) {
            return false;
        }
        String target = url.trim();

        // 1) 站主头像来自配置文件 tl.host.avatar，不在数据库里，必须单独保护
        if (equalsUrl(target, hostProperties.getAvatar())) {
            return true;
        }

        // 2) 文章封面 + 正文内嵌图：正文是富文本 HTML，图片地址只存在于文本里
        if (exists(articleMapper.selectCount(Wrappers.<Article>lambdaQuery()
                .eq(Article::getCoverImage, target)
                .or()
                .like(Article::getContent, target)))) {
            return true;
        }

        // 3) 相册原图
        if (exists(photoMapper.selectCount(Wrappers.<Photo>lambdaQuery()
                .eq(Photo::getUrl, target)))) {
            return true;
        }

        // 4) 作品集封面
        if (exists(portfolioMapper.selectCount(Wrappers.<Portfolio>lambdaQuery()
                .eq(Portfolio::getCoverImage, target)))) {
            return true;
        }

        // 5) 音乐封面 / 音频文件
        if (exists(musicMapper.selectCount(Wrappers.<Music>lambdaQuery()
                .eq(Music::getCoverImage, target)
                .or()
                .eq(Music::getAudioUrl, target)))) {
            return true;
        }

        // 6) 用户头像
        return exists(userMapper.selectCount(Wrappers.<User>lambdaQuery()
                .eq(User::getAvatar, target)));
    }

    @Override
    public void deleteIfUnused(String oldUrl, String newUrl) {
        // 没换地址（同一次保存里把旧值原样提交回来）直接跳过，避免误删正在使用的文件
        if (!StringUtils.hasText(oldUrl) || equalsUrl(oldUrl, newUrl)) {
            return;
        }
        deleteIfUnused(oldUrl);
    }

    @Override
    public void deleteIfUnused(String url) {
        if (!StringUtils.hasText(url)) {
            return;
        }
        String target = url.trim();
        // 手填的第三方外链不归我们管
        if (!objectStorageUtil.isOwnObject(target)) {
            return;
        }

        // 数据库提交之后再删文件：万一事务回滚，库里还指着旧地址，先删就会变成死链
        runAfterCommit(() -> {
            try {
                if (isReferenced(target)) {
                    log.info("[OSS 清理] 旧文件仍被引用，保留不删：{}", target);
                    return;
                }
                objectStorageUtil.deleteByUrl(target);
                log.info("[OSS 清理] 已删除被替换的旧文件：{}", target);
            } catch (Exception e) {
                // 清理属于尽力而为，任何异常都不能影响正常的业务更新
                log.warn("[OSS 清理] 删除旧文件失败：{}", target, e);
            }
        });
    }

    @Override
    public void deleteUnusedFromContent(String oldContent, String newContent) {
        if (!StringUtils.hasText(oldContent)) {
            return;
        }
        String current = newContent == null ? "" : newContent;
        Set<String> candidates = new LinkedHashSet<>();
        Matcher matcher = URL_PATTERN.matcher(oldContent);
        while (matcher.find()) {
            String url = matcher.group();
            // 旧正文里有、新正文里已经没有的本站 OSS 文件才是候选
            if (!current.contains(url) && objectStorageUtil.isOwnObject(url)) {
                candidates.add(url);
            }
        }
        candidates.forEach(this::deleteIfUnused);
    }

    /**
     * 有事务则挂到提交之后执行，没有事务（绝大多数更新方法）立即执行。
     * 这样"先更新数据库、再删旧文件"的顺序在两种情况下都成立。
     */
    private void runAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
            return;
        }
        action.run();
    }

    /** 两个地址是否指向同一个文件：忽略首尾空白与大小写，空值不算相同 */
    private boolean equalsUrl(String left, String right) {
        if (!StringUtils.hasText(left) || !StringUtils.hasText(right)) {
            return false;
        }
        return left.trim().equalsIgnoreCase(right.trim());
    }

    /** selectCount 结果是否大于 0 */
    private boolean exists(Long count) {
        return count != null && count > 0;
    }
}
