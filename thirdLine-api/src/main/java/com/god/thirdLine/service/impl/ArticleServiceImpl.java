package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.CursorPage;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.ArticleSaveDTO;
import com.god.thirdLine.domain.dto.ArticleUpdateDTO;
import com.god.thirdLine.domain.entity.Article;
import com.god.thirdLine.domain.entity.ArticleTag;
import com.god.thirdLine.domain.query.ArticlePageQuery;
import com.god.thirdLine.domain.query.ArticleQuery;
import com.god.thirdLine.domain.vo.ArticleTagVO;
import com.god.thirdLine.domain.vo.ArticleVO;
import com.god.thirdLine.domain.vo.TagVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.ArticleMapper;
import com.god.thirdLine.mapper.ArticleTagMapper;
import com.god.thirdLine.mapper.CategoryMapper;
import com.god.thirdLine.mapper.TagMapper;
import com.god.thirdLine.service.IArticleService;
import com.god.thirdLine.service.IOssReferenceService;
import com.god.thirdLine.util.ObjectStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * <p>
 * 文章表 服务实现类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-20
 */
@Service
@RequiredArgsConstructor
public class ArticleServiceImpl extends ServiceImpl<ArticleMapper, Article> implements IArticleService {

    private final ArticleTagMapper articleTagMapper;
    private final TagMapper tagMapper;
    private final CategoryMapper categoryMapper;
    private final ObjectStorageUtil objectStorageUtil;
    private final IOssReferenceService ossReferenceService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long saveArticle(Long authorId, ArticleSaveDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getTitle())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "文章标题不能为空");
        }
        // 必须先判断是否有所属分类id
        if (dto.getCategoryId() == null) {
            throw new BusinessException(ResultCode.CATEGORY_REQUIRED);
        }
        if (categoryMapper.selectById(dto.getCategoryId()) == null) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }

        LocalDateTime now = LocalDateTime.now();
        Article article = new Article()
                .setTitle(dto.getTitle())
                .setContent(dto.getContent())
                .setSummary(dto.getSummary())
                .setCoverImage(dto.getCoverImage())
                .setAuthorId(authorId)
                .setCategoryId(dto.getCategoryId())
                .setIsTop(dto.getIsTop() == null ? 0 : dto.getIsTop())
                .setIsOriginal(dto.getIsOriginal() == null ? 1 : dto.getIsOriginal())
                .setStatus(dto.getStatus() == null ? 1 : dto.getStatus());
        // createdTime / updatedTime 由 MetaObjectHandler 自动填充
        // 发布状态记录发布时间
        if (Integer.valueOf(1).equals(article.getStatus())) {
            article.setPublishedTime(now);
        }
        this.save(article);

        // 关联标签
        saveArticleTags(article.getId(), dto.getTagIds());
        return article.getId();
    }

    @Override
    public ArticleVO getArticleDetail(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "文章ID不能为空");
        }
        ArticleVO vo = baseMapper.selectArticleDetail(id);
        if (vo == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }
        vo.setTags(loadTags(Collections.singletonList(id)).getOrDefault(id, new ArrayList<>()));
        return vo;
    }

    @Override
    public CursorPage<ArticleVO> pageArticles(ArticleQuery query) {
        if (query == null) {
            query = new ArticleQuery();
        }
        int pageSize = query.getSize();
        // 多查一条用于判断是否还有下一页
        List<ArticleVO> list = baseMapper.selectArticlePage(query, pageSize + 1);

        boolean hasMore = list.size() > pageSize;
        if (hasMore) {
            list = list.subList(0, pageSize);
        }
        Long nextCursor = list.isEmpty() ? null : list.getLast().getId();

        // 批量装配标签
        if (!list.isEmpty()) {
            List<Long> ids = list.stream().map(ArticleVO::getId).collect(Collectors.toList());
            Map<Long, List<TagVO>> tagMap = loadTags(ids);
            list.forEach(vo -> vo.setTags(tagMap.getOrDefault(vo.getId(), new ArrayList<>())));
        }
        return new CursorPage<>(list, nextCursor, hasMore);
    }

    @Override
    public PageResult<ArticleVO> pageArticlesByNumber(ArticlePageQuery query) {
        ArticlePageQuery condition = query == null ? new ArticlePageQuery() : query;
        // 分页参数交给 MyBatis-Plus 分页插件：自动拼 LIMIT，并生成对应的 COUNT 查询
        Page<ArticleVO> page = new Page<>(condition.getPage(), condition.getSize());
        IPage<ArticleVO> result = baseMapper.selectArticlePageList(page, condition);

        List<ArticleVO> records = result.getRecords();
        if (!records.isEmpty()) {
            // 批量装配标签，避免逐条查询
            List<Long> ids = records.stream().map(ArticleVO::getId).collect(Collectors.toList());
            Map<Long, List<TagVO>> tagMap = loadTags(ids);
            records.forEach(vo -> vo.setTags(tagMap.getOrDefault(vo.getId(), new ArrayList<>())));
        }
        return new PageResult<>(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteArticle(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "文章ID不能为空");
        }
        Article article = this.getById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }
        // 删除文章
        this.removeById(id);
        // 级联删除标签关联
        articleTagMapper.delete(Wrappers.<ArticleTag>lambdaQuery().eq(ArticleTag::getArticleId, id));
        // 同步清理 OSS 上的封面图（手填外链自动跳过）
        objectStorageUtil.deleteByUrl(article.getCoverImage());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateArticle(ArticleUpdateDTO dto) {
        if (dto == null || dto.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "文章ID不能为空");
        }
        Article article = this.getById(dto.getId());
        if (article == null) {
            throw new BusinessException(ResultCode.ARTICLE_NOT_FOUND);
        }
        // 记录旧封面与旧正文：更新成功后要清理被替换 / 被删掉的 OSS 文件
        String oldCoverImage = article.getCoverImage();
        String oldContent = article.getContent();

        if (dto.getCategoryId() != null && !dto.getCategoryId().equals(article.getCategoryId())) {
            if (categoryMapper.selectById(dto.getCategoryId()) == null) {
                throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
            }
            article.setCategoryId(dto.getCategoryId());
        }
        if (dto.getTitle() != null) {
            article.setTitle(dto.getTitle());
        }
        if (dto.getContent() != null) {
            article.setContent(dto.getContent());
        }
        if (dto.getSummary() != null) {
            article.setSummary(dto.getSummary());
        }
        if (dto.getCoverImage() != null) {
            article.setCoverImage(dto.getCoverImage());
        }
        if (dto.getIsTop() != null) {
            article.setIsTop(dto.getIsTop());
        }
        if (dto.getIsOriginal() != null) {
            article.setIsOriginal(dto.getIsOriginal());
        }
        if (dto.getStatus() != null) {
            article.setStatus(dto.getStatus());
            // 首次发布补充发布时间
            if (Integer.valueOf(1).equals(dto.getStatus()) && article.getPublishedTime() == null) {
                article.setPublishedTime(LocalDateTime.now());
            }
        }
        // updatedTime 由 MetaObjectHandler 自动刷新
        this.updateById(article);

        // tagIds 非 null 时整体覆盖标签关联
        if (dto.getTagIds() != null) {
            articleTagMapper.delete(Wrappers.<ArticleTag>lambdaQuery()
                    .eq(ArticleTag::getArticleId, article.getId()));
            saveArticleTags(article.getId(), dto.getTagIds());
        }

        // 封面被替换（或清空）后清理旧文件：确认无人引用才删，第三方外链自动跳过
        if (dto.getCoverImage() != null) {
            ossReferenceService.deleteIfUnused(oldCoverImage, dto.getCoverImage());
        }
        // 正文里被删掉的图片同样清理（只处理本站 OSS 地址）
        if (dto.getContent() != null) {
            ossReferenceService.deleteUnusedFromContent(oldContent, dto.getContent());
        }
    }

    /**
     * 保存文章标签关联（自动去重、忽略空集合）。
     * 整批拼成一条 INSERT，避免在循环里逐条写库。
     */
    private void saveArticleTags(Long articleId, List<Long> tagIds) {
        if (CollectionUtils.isEmpty(tagIds)) {
            return;
        }
        // 去重并保持顺序，顺带过滤掉前端可能带过来的 null
        LinkedHashSet<Long> distinctIds = new LinkedHashSet<>(tagIds);
        distinctIds.remove(null);
        if (distinctIds.isEmpty()) {
            return;
        }
        List<ArticleTag> relations = distinctIds.stream()
                .map(tagId -> new ArticleTag().setArticleId(articleId).setTagId(tagId))
                .collect(Collectors.toList());
        articleTagMapper.insertBatch(relations);
    }

    /**
     * 批量加载文章标签，返回 articleId -> 标签列表 的映射
     */
    private Map<Long, List<TagVO>> loadTags(List<Long> articleIds) {
        if (CollectionUtils.isEmpty(articleIds)) {
            return Collections.emptyMap();
        }
        List<ArticleTagVO> relations = tagMapper.selectArticleTags(articleIds);
        return relations.stream().collect(Collectors.groupingBy(
                ArticleTagVO::getArticleId,
                Collectors.mapping(rel -> {
                    TagVO tag = new TagVO();
                    tag.setId(rel.getTagId());
                    tag.setName(rel.getTagName());
                    return tag;
                }, Collectors.toList())
        ));
    }
}
