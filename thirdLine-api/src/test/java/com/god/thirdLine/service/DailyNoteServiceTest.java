package com.god.thirdLine.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.god.thirdLine.context.UserContext;
import com.god.thirdLine.domain.dto.DailyNoteDTO;
import com.god.thirdLine.domain.entity.DailyNote;
import com.god.thirdLine.domain.query.DailyNoteQuery;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.DailyNoteMapper;
import com.god.thirdLine.service.impl.DailyNoteService;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DuplicateKeyException;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class DailyNoteServiceTest {
    private final DailyNoteMapper mapper = mock(DailyNoteMapper.class);
    private final IOssReferenceService references = mock(IOssReferenceService.class);
    private final DailyNoteService service = new DailyNoteService(mapper, references);
    @BeforeEach void setup() {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), "note-test"), DailyNote.class);
        UserContext.setUserId(7L);
    }
    @AfterEach void cleanup() { UserContext.clear(); }
    private DailyNoteDTO dto() {
        var dto = new DailyNoteDTO();
        dto.setNoteDate(LocalDate.of(2020, 1, 1));
        dto.setContent("<p>今天很好</p>"); dto.setMood(0); dto.setWeather(0); dto.setPublishStatus(1);
        return dto;
    }
    @Test void permitsEmptyDraftAndUsesAuthenticatedUser() {
        var dto = dto(); dto.setPublishStatus(0); dto.setContent(null); dto.setMood(null); dto.setWeather(null);
        service.save(dto, false);
        var saved = ArgumentCaptor.forClass(DailyNote.class); verify(mapper).insert(saved.capture());
        assertEquals(7L, saved.getValue().getUserId()); assertNull(saved.getValue().getPublishTime());
        assertEquals(LocalDate.now(ZoneId.of("Asia/Shanghai")), saved.getValue().getCreateTime().toLocalDate());
    }
    @Test void rejectsFutureDateInvalidOptionsAndEmptyPublishedHtml() {
        var dto = dto(); dto.setNoteDate(LocalDate.now(ZoneId.of("Asia/Shanghai")).plusDays(1));
        assertThrows(BusinessException.class, () -> service.save(dto, false));
        dto.setNoteDate(LocalDate.of(2020, 1, 1)); dto.setMood(6);
        assertThrows(BusinessException.class, () -> service.save(dto, false));
        dto.setMood(0); dto.setWeather(null);
        assertThrows(BusinessException.class, () -> service.save(dto, false));
        dto.setWeather(0);
        for (String html : new String[]{"<p><br></p>", "<p>&nbsp;\u200b</p>", "<script>alert(1)</script>", "<img src='javascript:alert(1)'>"}) {
            dto.setContent(html); assertThrows(BusinessException.class, () -> service.save(dto, false));
        }
        verify(mapper, never()).insert(any(DailyNote.class));
    }
    @Test void acceptsImageOnlyAndRemovesUnsafeHtml() {
        var dto = dto(); dto.setContent("<script>alert(1)</script><img src='https://example.com/a.jpg' onerror='alert(2)'>");
        service.save(dto, false);
        var saved = ArgumentCaptor.forClass(DailyNote.class); verify(mapper).insert(saved.capture());
        assertFalse(saved.getValue().getContent().contains("script"));
        assertFalse(saved.getValue().getContent().contains("onerror"));
        assertTrue(saved.getValue().getContent().contains("https://example.com/a.jpg"));
        assertNotNull(saved.getValue().getPublishTime());
    }
    @Test void preservesEditorFormattingButDropsUnsafeStyles() {
        var dto = dto(); dto.setContent("<p style='text-align: center;color: rgb(255, 0, 0);background-image:url(https://evil.test);position:fixed'>正文</p>");
        service.save(dto, false);
        var saved = ArgumentCaptor.forClass(DailyNote.class); verify(mapper).insert(saved.capture());
        String html = saved.getValue().getContent();
        assertTrue(html.contains("text-align: center")); assertTrue(html.contains("color: rgb(255, 0, 0)"));
        assertFalse(html.contains("evil.test")); assertFalse(html.contains("position"));
    }
    @Test void rejectsDateCollisionAndConcurrentUniqueConstraintFailure() {
        when(mapper.selectCount(any())).thenReturn(1L);
        assertThrows(BusinessException.class, () -> service.save(dto(), false));
        when(mapper.selectCount(any())).thenReturn(0L);
        when(mapper.insert(any(DailyNote.class))).thenThrow(new DuplicateKeyException("duplicate"));
        assertTrue(assertThrows(BusinessException.class, () -> service.save(dto(), false)).getMessage().contains("该日期已有小记"));
    }
    @Test void editingAndWithdrawalKeepPublishTimeButRepublishingUpdatesIt() {
        var previous = LocalDateTime.of(2020, 1, 2, 12, 0);
        var item = new DailyNote().setId(1L).setUserId(7L).setContent("old").setPublishStatus(1).setPublishTime(previous);
        when(mapper.selectById(1L)).thenReturn(item); when(mapper.updateById(any(DailyNote.class))).thenReturn(1);
        var dto = dto(); dto.setId(1L);
        service.save(dto, true); assertEquals(previous, item.getPublishTime());
        dto.setPublishStatus(0); service.save(dto, true); assertEquals(previous, item.getPublishTime());
        dto.setPublishStatus(1); service.save(dto, true); assertTrue(item.getPublishTime().isAfter(previous));
        assertEquals(7L, item.getUserId());
        verify(references).deleteUnusedFromContent("old", "<p>今天很好</p>");
    }
    @Test void publicPageAlwaysFiltersDraftsAndSortsByNoteDate() {
        when(mapper.selectPage(any(Page.class), any())).thenReturn(new Page<DailyNote>(1, 10));
        var query = new DailyNoteQuery(); query.setPublishStatus(0); service.page(query, false);
        var wrapper = ArgumentCaptor.forClass(Wrapper.class); verify(mapper).selectPage(any(Page.class), wrapper.capture());
        assertTrue(wrapper.getValue().getSqlSegment().endsWith("ORDER BY note_date DESC"));
        assertTrue(((LambdaQueryWrapper<?>) wrapper.getValue()).getParamNameValuePairs().containsValue(1));
        assertFalse(((LambdaQueryWrapper<?>) wrapper.getValue()).getParamNameValuePairs().containsValue(0));
    }
    @Test void adminPageWithoutStatusListsAllNotes() {
        when(mapper.selectPage(any(Page.class), any())).thenReturn(new Page<DailyNote>(1, 10));
        assertDoesNotThrow(() -> service.page(new DailyNoteQuery(), true));
        var wrapper = ArgumentCaptor.forClass(Wrapper.class);
        verify(mapper).selectPage(any(Page.class), wrapper.capture());
        assertEquals("ORDER BY note_date DESC", wrapper.getValue().getSqlSegment().trim());
        assertTrue(((LambdaQueryWrapper<?>) wrapper.getValue()).getParamNameValuePairs().isEmpty());
    }
    @Test void dateDirectorySelectsOnlyPublishedIdsAndDates() {
        when(mapper.selectList(any(Wrapper.class))).thenReturn(java.util.List.of(
                new DailyNote().setId(1L).setNoteDate(LocalDate.of(2020, 1, 1))));
        var result = service.dates();
        assertEquals(1L, result.getFirst().id());
        assertEquals(LocalDate.of(2020, 1, 1), result.getFirst().noteDate());
        var wrapper = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(mapper).selectList(wrapper.capture());
        assertEquals("id,note_date", wrapper.getValue().getSqlSelect());
        assertTrue(wrapper.getValue().getSqlSegment().contains("publish_status ="));
        assertTrue(wrapper.getValue().getSqlSegment().endsWith("ORDER BY note_date DESC"));
        assertEquals(java.util.List.of(1), wrapper.getValue().getParamNameValuePairs().values().stream().toList());
    }
    @Test void publicDetailFiltersByIdAndPublishedStatusAndRejectsUnavailableNote() {
        when(mapper.selectOne(any(Wrapper.class))).thenReturn(new DailyNote().setId(7L).setContent("正文"));
        assertEquals("正文", service.publishedDetail(7L).content());
        var wrapper = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(mapper).selectOne(wrapper.capture());
        assertTrue(wrapper.getValue().getSqlSegment().contains("id ="));
        assertTrue(wrapper.getValue().getSqlSegment().contains("publish_status ="));
        assertTrue(wrapper.getValue().getParamNameValuePairs().containsValue(7L));
        assertTrue(wrapper.getValue().getParamNameValuePairs().containsValue(1));
        when(mapper.selectOne(any(Wrapper.class))).thenReturn(null);
        assertThrows(BusinessException.class, () -> service.publishedDetail(7L));
        assertThrows(BusinessException.class, () -> service.publishedDetail(null));
        assertThrows(BusinessException.class, () -> service.publishedDetail(-1L));
    }
    @Test void adminPageFiltersDraftsAndPublishedNotes() {
        when(mapper.selectPage(any(Page.class), any())).thenReturn(new Page<DailyNote>(1, 10));
        for (int status : new int[]{0, 1}) {
            clearInvocations(mapper);
            var query = new DailyNoteQuery(); query.setPublishStatus(status);
            service.page(query, true);
            var wrapper = ArgumentCaptor.forClass(Wrapper.class);
            verify(mapper).selectPage(any(Page.class), wrapper.capture());
            assertTrue(wrapper.getValue().getSqlSegment().contains("publish_status ="));
            assertEquals(java.util.List.of(status), ((LambdaQueryWrapper<?>) wrapper.getValue())
                    .getParamNameValuePairs().values().stream().toList());
        }
    }
    @Test void deletionCleansOldContentReferences() {
        when(mapper.selectById(1L)).thenReturn(new DailyNote().setId(1L).setContent("old"));
        service.delete(1L); verify(mapper).deleteById(1L); verify(references).deleteUnusedFromContent("old", "");
    }
}
