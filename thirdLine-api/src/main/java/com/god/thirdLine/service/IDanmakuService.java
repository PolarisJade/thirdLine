package com.god.thirdLine.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.domain.dto.DanmakuReportDTO;
import com.god.thirdLine.domain.dto.DanmakuSendDTO;
import com.god.thirdLine.domain.entity.Danmaku;
import com.god.thirdLine.domain.query.DanmakuQuery;
import com.god.thirdLine.domain.vo.DanmakuPoolVO;
import com.god.thirdLine.domain.vo.DanmakuReportVO;
import com.god.thirdLine.domain.vo.DanmakuVO;

/**
 * <p>
 * 弹幕 服务类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-09-27
 */
public interface IDanmakuService extends IService<Danmaku> {

    /**
     * 登录用户发送弹幕：校验全局开关、非空、长度、敏感词与发送频率后落库
     *
     * @param userId 发送用户ID
     * @param dto    弹幕内容、颜色
     * @return 发送成功的弹幕
     */
    DanmakuVO send(Long userId, DanmakuSendDTO dto);

    /**
     * 拉取弹幕池（前台弹幕页）：含全局开关状态与最近 limit 条可见弹幕
     *
     * @param limit 最多返回条数
     */
    DanmakuPoolVO getPool(int limit);

    /**
     * 登录用户举报某条弹幕（同一用户对同一弹幕只能举报一次）
     *
     * @param userId 举报人ID
     * @param dto    被举报弹幕ID、理由
     */
    void report(Long userId, DanmakuReportDTO dto);

    /**
     * 后台分页查询弹幕（可按状态过滤，含每条累计举报数）
     */
    PageResult<DanmakuVO> pageDanmaku(DanmakuQuery query);

    /**
     * 后台切换弹幕显隐状态
     *
     * @param id     弹幕ID
     * @param status 0隐藏 / 1显示
     */
    void updateStatus(Long id, Integer status);

    /**
     * 后台删除弹幕（连带删除其举报记录）
     */
    void deleteDanmaku(Long id);

    /**
     * 后台分页查询举报记录（可按处理状态过滤）
     *
     * @param status 处理状态：0待处理/1已处理，为空不限制
     * @param page   页码
     * @param size   每页条数
     */
    PageResult<DanmakuReportVO> pageReports(Integer status, Integer page, Integer size);

    /**
     * 后台将某条举报记录标记为已处理
     */
    void handleReport(Long reportId);
}
