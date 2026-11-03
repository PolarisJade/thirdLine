package com.god.thirdLine.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.SiteHistoryDTO;
import com.god.thirdLine.domain.entity.SiteHistory;
import com.god.thirdLine.domain.enums.*;
import com.god.thirdLine.domain.query.SiteHistoryQuery;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.SiteHistoryMapper;
import com.god.thirdLine.service.impl.SiteHistoryServiceImpl;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.time.LocalDate;
import java.util.List;
import java.util.function.Consumer;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SiteHistoryServiceTest {
    private final SiteHistoryMapper mapper = mock(SiteHistoryMapper.class);
    private final SiteHistoryServiceImpl service = new SiteHistoryServiceImpl(mapper);

    @BeforeEach
    void setUp() {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), "history-test"), SiteHistory.class);
    }

    @Test
    void createsDraftAndAcceptsHistoricalDateAndMultilinePlainText() {
        var dto = valid();
        when(mapper.insert(any(SiteHistory.class))).thenAnswer(call -> {
            call.<SiteHistory>getArgument(0).setId(8L);
            return 1;
        });
        assertEquals(8L, service.create(dto));
        var saved = ArgumentCaptor.forClass(SiteHistory.class);
        verify(mapper).insert(saved.capture());
        assertEquals(0, saved.getValue().getPublishStatus());
        assertEquals(1, saved.getValue().getStatus());
        assertEquals(LocalDate.of(2020, 1, 2), saved.getValue().getUpdateDate());
        assertEquals("第一行\n<script>纯文本</script>", saved.getValue().getDescription());
        assertEquals("v1.0", saved.getValue().getVersion());
    }

    @Test
    void permitsAllValidTypeAndStateCombinations() {
        for (var type : HistoryUpdateType.values()) {
            for (var publish : HistoryPublishStatus.values()) {
                for (var display : HistoryDisplayStatus.values()) {
                    var dto = valid();
                    dto.setUpdateType(type.getCode());
                    dto.setPublishStatus(publish.getCode());
                    dto.setStatus(display.getCode());
                    assertDoesNotThrow(() -> service.create(dto));
                }
            }
        }
        verify(mapper, times(12)).insert(any(SiteHistory.class));
    }

    @Test
    void rejectsMissingAndOversizedContentBeforeWriting() {
        List<Consumer<SiteHistoryDTO>> invalid = List.of(
                d -> d.setDescription(null), d -> d.setDescription("  \n "),
                d -> d.setDescription("中".repeat(21846)),
                d -> d.setVersion(null), d -> d.setVersion(" "),
                d -> d.setVersion("x".repeat(33)),
                d -> d.setUpdateDate(null), d -> d.setUpdateDate(LocalDate.of(999, 1, 1)),
                d -> d.setUpdateDate(LocalDate.of(10000, 1, 1)),
                d -> d.setUpdateType(null), d -> d.setUpdateType(3),
                d -> d.setPublishStatus(2), d -> d.setStatus(-1));
        for (var change : invalid) {
            var dto = valid();
            change.accept(dto);
            assertCode(ResultCode.PARAM_ERROR, () -> service.create(dto));
        }
        assertCode(ResultCode.PARAM_ERROR, () -> service.create(null));
        verify(mapper, never()).insert(any(SiteHistory.class));
    }

    @Test
    void publicQueryRequiresPublishedAndVisibleAndStableAscendingOrder() {
        when(mapper.selectList(any(Wrapper.class))).thenReturn(List.of(entity()));
        var result = service.listPublished();
        var query = ArgumentCaptor.forClass(Wrapper.class);
        verify(mapper).selectList(query.capture());
        String sql = query.getValue().getSqlSegment();
        assertTrue(sql.contains("publish_status ="));
        assertTrue(sql.contains("status ="));
        assertTrue(sql.endsWith("ORDER BY update_date ASC,id ASC"), sql);
        var params = ((LambdaQueryWrapper<?>) query.getValue()).getParamNameValuePairs();
        assertEquals(List.of(1, 1), params.values().stream().toList());
        assertEquals("新增功能", result.getFirst().updateTypeLabel());
        assertEquals(LocalDate.of(2020, 1, 2), result.getFirst().updateDate());
        // Public DTO structurally excludes unpublished/internal fields.
        assertFalse(java.util.Arrays.stream(result.getFirst().getClass().getRecordComponents())
                .anyMatch(field -> field.getName().equals("publishStatus") || field.getName().equals("status")));
    }

    @Test
    void adminPaginationFiltersAndConvertsEnumLabels() {
        var query = new SiteHistoryQuery();
        query.setPage(2);
        query.setSize(500);
        query.setKeyword(" v1 ");
        query.setUpdateType(0);
        query.setPublishStatus(0);
        query.setStatus(1);
        when(mapper.selectPage(any(Page.class), any(Wrapper.class))).thenAnswer(call -> {
            Page<SiteHistory> page = call.getArgument(0);
            page.setRecords(List.of(entity()));
            page.setTotal(120);
            return page;
        });
        var result = service.page(query);
        assertEquals(2L, result.getCurrent());
        assertEquals(100L, result.getSize());
        assertEquals(120L, result.getTotal());
        assertEquals("草稿", result.getRecords().getFirst().publishStatusLabel());
        assertEquals("显示", result.getRecords().getFirst().statusLabel());
        var wrapper = ArgumentCaptor.forClass(Wrapper.class);
        verify(mapper).selectPage(any(Page.class), wrapper.capture());
        String sql = wrapper.getValue().getSqlSegment();
        assertTrue(sql.contains("update_type ="));
        assertTrue(sql.contains("publish_status ="));
        assertTrue(sql.contains("status ="));
        assertTrue(sql.contains("(version LIKE"));
        assertTrue(sql.contains("OR description LIKE"));
        assertTrue(sql.endsWith("ORDER BY update_date DESC,id DESC"), sql);
    }

    @Test
    void invalidFiltersAndEnumsAreRejected() {
        for (Integer invalid : new Integer[]{null, -1, 3, 99}) {
            assertCode(ResultCode.PARAM_ERROR, () -> HistoryUpdateType.fromCode(invalid));
            assertCode(ResultCode.PARAM_ERROR, () -> HistoryPublishStatus.fromCode(invalid));
            assertCode(ResultCode.PARAM_ERROR, () -> HistoryDisplayStatus.fromCode(invalid));
        }
        var query = new SiteHistoryQuery();
        query.setStatus(2);
        assertCode(ResultCode.PARAM_ERROR, () -> service.page(query));
        query.setStatus(null);
        query.setUpdateType(3);
        assertCode(ResultCode.PARAM_ERROR, () -> service.page(query));
        query.setUpdateType(null);
        query.setPublishStatus(-1);
        assertCode(ResultCode.PARAM_ERROR, () -> service.page(query));
        verifyNoInteractions(mapper);
    }

    @Test
    void togglesOnlyRequestedStateWithoutOverwritingContent() {
        when(mapper.selectById(8L)).thenReturn(entity());
        service.changePublishStatus(8L, 1);
        service.changeStatus(8L, 0);
        var patch = ArgumentCaptor.forClass(SiteHistory.class);
        verify(mapper, times(2)).updateById(patch.capture());
        assertEquals(1, patch.getAllValues().get(0).getPublishStatus());
        assertNull(patch.getAllValues().get(0).getStatus());
        assertEquals(0, patch.getAllValues().get(1).getStatus());
        assertNull(patch.getAllValues().get(1).getPublishStatus());
        for (SiteHistory item : patch.getAllValues()) {
            assertEquals(8L, item.getId());
            assertNull(item.getDescription());
            assertNull(item.getUpdateDate());
            assertNull(item.getVersion());
            assertNull(item.getUpdateType());
        }
    }

    @Test
    void contentEditPreservesOmittedStatesAndAllowsSameVersion() {
        when(mapper.selectById(8L)).thenReturn(entity());
        var dto = valid();
        dto.setId(8L);
        dto.setDescription("补录修改");
        service.update(dto);
        var patch = ArgumentCaptor.forClass(SiteHistory.class);
        verify(mapper).updateById(patch.capture());
        assertEquals("补录修改", patch.getValue().getDescription());
        assertEquals("v1.0", patch.getValue().getVersion());
        assertNull(patch.getValue().getPublishStatus());
        assertNull(patch.getValue().getStatus());
        verify(mapper, never()).selectCount(any());
    }

    @Test
    void rejectsMissingRecordsAndInvalidIdsOnMutations() {
        var dto = valid();
        dto.setId(9L);
        assertCode(ResultCode.SITE_HISTORY_NOT_FOUND, () -> service.update(dto));
        assertCode(ResultCode.SITE_HISTORY_NOT_FOUND, () -> service.delete(9L));
        assertCode(ResultCode.SITE_HISTORY_NOT_FOUND, () -> service.changePublishStatus(9L, 1));
        assertCode(ResultCode.SITE_HISTORY_NOT_FOUND, () -> service.changeStatus(9L, 0));
        assertCode(ResultCode.PARAM_ERROR, () -> service.delete(null));
        assertCode(ResultCode.PARAM_ERROR, () -> service.delete(0L));
        assertCode(ResultCode.PARAM_ERROR, () -> service.update(null));
        assertCode(ResultCode.PARAM_ERROR, () -> service.changeStatus(8L, 2));
        assertCode(ResultCode.PARAM_ERROR, () -> service.changePublishStatus(8L, null));
        verify(mapper, never()).updateById(any(SiteHistory.class));
        verify(mapper, never()).deleteById(anyLong());
    }

    @Test
    void deletesExistingRecord() {
        when(mapper.selectById(8L)).thenReturn(entity());
        service.delete(8L);
        verify(mapper).deleteById(8L);
    }

    @Test
    void optionsExposeEnumCodesAndLabelsAndPaginationDefaults() {
        var options = service.options();
        assertEquals(List.of(0, 1, 2), options.updateTypes().stream().map(o -> o.value()).toList());
        assertEquals(List.of("新增功能", "功能优化", "问题修复"), options.updateTypes().stream().map(o -> o.label()).toList());
        assertEquals(List.of("草稿", "已发布"), options.publishStatuses().stream().map(o -> o.label()).toList());
        assertEquals(List.of("隐藏", "显示"), options.statuses().stream().map(o -> o.label()).toList());
        var query = new SiteHistoryQuery();
        query.setPage(-1);
        query.setSize(null);
        assertEquals(1, query.getPage());
        assertEquals(10, query.getSize());
    }

    private SiteHistoryDTO valid() {
        var dto = new SiteHistoryDTO();
        dto.setDescription(" 第一行\n<script>纯文本</script> ");
        dto.setVersion(" v1.0 ");
        dto.setUpdateDate(LocalDate.of(2020, 1, 2));
        dto.setUpdateType(0);
        return dto;
    }

    private SiteHistory entity() {
        return new SiteHistory().setId(8L).setDescription("第一行\n第二行")
                .setVersion("v1.0").setUpdateDate(LocalDate.of(2020, 1, 2))
                .setUpdateType(0).setPublishStatus(0).setStatus(1);
    }

    private void assertCode(ResultCode code, Runnable action) {
        assertEquals(code.getCode(), assertThrows(BusinessException.class, action::run).getCode());
    }
}

