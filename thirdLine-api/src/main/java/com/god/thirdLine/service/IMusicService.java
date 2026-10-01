package com.god.thirdLine.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.domain.dto.MusicDTO;
import com.god.thirdLine.domain.entity.Music;
import com.god.thirdLine.domain.query.MusicQuery;
import com.god.thirdLine.domain.vo.MusicVO;

import java.util.List;

/**
 * <p>
 * 音乐表 服务类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-10-01
 */
public interface IMusicService extends IService<Music> {

    /**
     * 新增音乐，sort 未指定时自动追加到末尾（当前最大 sort + 1）
     *
     * @param dto 音乐数据
     * @return 新增音乐ID
     */
    Long saveMusic(MusicDTO dto);

    /**
     * 修改音乐（可修改歌曲名、歌手、封面、音频、排序、上下架等）
     *
     * @param dto 音乐数据，id 必填
     */
    void updateMusic(MusicDTO dto);

    /**
     * 根据ID删除音乐
     *
     * @param id 音乐ID
     */
    void deleteMusic(Long id);

    /**
     * 根据ID查询音乐详情
     *
     * @param id 音乐ID
     * @return 音乐详情
     */
    MusicVO getMusicDetail(Long id);

    /**
     * 标准分页查询音乐（后台管理，可按状态 / 关键词过滤）
     *
     * @param query 查询条件
     * @return 分页结果
     */
    PageResult<MusicVO> pageMusics(MusicQuery query);

    /**
     * 查询全部上架音乐，按排序权重升序（前台悬浮播放器使用）
     *
     * @return 音乐列表
     */
    List<MusicVO> listEnabledMusics();
}
