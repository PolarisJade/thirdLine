package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.god.thirdLine.common.*;
import com.god.thirdLine.context.UserContext;
import com.god.thirdLine.domain.dto.DailyNoteDTO;
import com.god.thirdLine.domain.entity.DailyNote;
import com.god.thirdLine.domain.query.DailyNoteQuery;
import com.god.thirdLine.domain.vo.DailyNoteVO;
import com.god.thirdLine.domain.vo.DailyNoteDateVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.DailyNoteMapper;
import com.god.thirdLine.service.IOssReferenceService;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.Locale;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyNoteService {
    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");
    private static final Safelist HTML = Safelist.relaxed()
            .addTags("s", "del", "span", "hr")
            .addAttributes("code", "class")
            .addAttributes(":all", "style")
            .addAttributes("img", "width", "height", "data-href")
            .addAttributes("a", "target")
            .addEnforcedAttribute("a", "rel", "noopener noreferrer");
    private final DailyNoteMapper mapper;
    private final IOssReferenceService references;

    public List<DailyNoteDateVO> dates() {
        return mapper.selectList(Wrappers.<DailyNote>lambdaQuery()
                        .select(DailyNote::getId, DailyNote::getNoteDate)
                        .eq(DailyNote::getPublishStatus, 1)
                        .orderByDesc(DailyNote::getNoteDate))
                .stream().map(item -> new DailyNoteDateVO(item.getId(), item.getNoteDate())).toList();
    }

    public DailyNoteVO publishedDetail(Long id) {
        if (id == null || id <= 0) throw bad("小记不存在或未发布");
        var item = mapper.selectOne(Wrappers.<DailyNote>lambdaQuery()
                .eq(DailyNote::getId, id).eq(DailyNote::getPublishStatus, 1));
        if (item == null) throw bad("小记不存在或未发布");
        return view(item);
    }

    public PageResult<DailyNoteVO> page(DailyNoteQuery query, boolean admin) {
        if (admin && query.getPublishStatus() != null) status(query.getPublishStatus());
        var wrapper = Wrappers.<DailyNote>lambdaQuery();
        if (!admin) {
            wrapper.eq(DailyNote::getPublishStatus, 1);
        } else if (query.getPublishStatus() != null) {
            wrapper.eq(DailyNote::getPublishStatus, query.getPublishStatus());
        }
        wrapper.orderByDesc(DailyNote::getNoteDate);
        var page = mapper.selectPage(new Page<>(query.getPage(), query.getSize()), wrapper);
        return new PageResult<>(page.getRecords().stream().map(this::view).toList(),
                page.getTotal(), page.getCurrent(), page.getSize());
    }

    @Transactional
    public Long save(DailyNoteDTO dto, boolean update) {
        if (dto == null) throw bad("小记内容不能为空");
        DailyNote item = update ? existing(dto.getId()) : new DailyNote();
        String oldContent = item.getContent();
        var now = LocalDateTime.now(ZONE);
        if (dto.getNoteDate() == null || dto.getNoteDate().getYear() < 1000
                || dto.getNoteDate().isAfter(now.toLocalDate())) throw bad("请选择有效日期，不能晚于北京时间今天");
        option(dto.getMood(), 5, "心情");
        option(dto.getWeather(), 8, "天气");
        int nextStatus = dto.getPublishStatus() == null ? (update ? item.getPublishStatus() : 0) : dto.getPublishStatus();
        status(nextStatus);
        String raw = dto.getContent() == null ? "" : dto.getContent();
        if (raw.getBytes(StandardCharsets.UTF_8).length > 1_000_000) throw bad("正文过长，请缩短内容");
        String clean = Jsoup.clean(raw, "", HTML, new org.jsoup.nodes.Document.OutputSettings().prettyPrint(false));
        var document = Jsoup.parseBodyFragment(clean);
        // 只保留编辑器常用的排版属性，不允许任意 CSS、URL 或定位样式。
        document.select("[style]").forEach(element -> {
            String safeStyle = java.util.Arrays.stream(element.attr("style").split(";"))
                    .map(String::trim).filter(this::safeDeclaration).collect(Collectors.joining(";"));
            if (safeStyle.isEmpty()) element.removeAttr("style");
            else element.attr("style", safeStyle);
        });
        document.outputSettings().prettyPrint(false);
        clean = document.body().html();
        boolean hasText = document.text().codePoints().anyMatch(c -> !Character.isWhitespace(c)
                && !Character.isSpaceChar(c) && c != 0x200B && c != 0xFEFF);
        boolean hasImage = document.select("img[src]").stream().anyMatch(img -> !img.attr("src").isBlank());
        if (nextStatus == 1 && (dto.getMood() == null || dto.getWeather() == null || (!hasText && !hasImage)))
            throw bad("发布时请填写正文，并选择心情和天气");
        if (mapper.selectCount(Wrappers.<DailyNote>lambdaQuery().eq(DailyNote::getNoteDate, dto.getNoteDate())
                .ne(update, DailyNote::getId, item.getId())) > 0) throw bad("该日期已有小记，草稿也占用当天名额");
        if (nextStatus == 1 && !Integer.valueOf(1).equals(item.getPublishStatus())) item.setPublishTime(now);
        item.setNoteDate(dto.getNoteDate()).setContent(clean).setMood(dto.getMood()).setWeather(dto.getWeather())
                .setPublishStatus(nextStatus).setUpdateTime(now);
        try {
            if (update) {
                if (mapper.updateById(item) == 0) throw bad("小记不存在或已删除");
                references.deleteUnusedFromContent(oldContent, clean);
            } else {
                if (UserContext.getUserId() == null) throw new BusinessException(ResultCode.UNAUTHORIZED);
                item.setUserId(UserContext.getUserId()).setCreateTime(now);
                mapper.insert(item);
            }
        } catch (DuplicateKeyException e) {
            throw bad("该日期已有小记，草稿也占用当天名额");
        }
        return item.getId();
    }

    @Transactional
    public void delete(Long id) {
        var item = existing(id);
        mapper.deleteById(id);
        references.deleteUnusedFromContent(item.getContent(), "");
    }

    private DailyNote existing(Long id) {
        if (id == null || id <= 0) throw bad("小记ID不合法");
        var item = mapper.selectById(id);
        if (item == null) throw bad("小记不存在或已删除");
        return item;
    }
    private void status(Integer value) { if (value != 0 && value != 1) throw bad("发布状态不合法"); }
    private void option(Integer value, int max, String label) {
        if (value != null && (value < 0 || value > max)) throw bad(label + "选项不合法");
    }
    private boolean safeDeclaration(String declaration) {
        int colon = declaration.indexOf(':');
        if (colon < 0) return false;
        String property = declaration.substring(0, colon).trim().toLowerCase(Locale.ROOT);
        String value = declaration.substring(colon + 1).trim().toLowerCase(Locale.ROOT);
        return switch (property) {
            case "text-align" -> value.matches("left|right|center|justify");
            case "color", "background-color" -> value.matches("#[0-9a-f]{3,8}|[a-z]{1,24}|rgba?\\([0-9.,% ]+\\)");
            case "font-size" -> value.matches("[0-9]{1,3}(\\.[0-9]{1,2})?(px|em|rem|pt|%)");
            case "font-weight" -> value.matches("normal|bold|[1-9]00");
            case "font-style" -> value.matches("normal|italic");
            case "text-decoration" -> value.matches("none|underline|line-through");
            case "text-indent" -> value.matches("[0-9]{1,2}(em|px)");
            case "line-height" -> value.matches("[0-9]{1,2}(\\.[0-9]{1,2})?(px|em|%)?");
            default -> false;
        };
    }
    private BusinessException bad(String message) { return new BusinessException(ResultCode.PARAM_ERROR, message); }
    private DailyNoteVO view(DailyNote item) {
        return new DailyNoteVO(item.getId(), item.getNoteDate(), item.getContent(), item.getMood(), item.getWeather(),
                item.getPublishStatus(), item.getPublishTime(), item.getCreateTime(), item.getUpdateTime());
    }
}
