package com.god.thirdLine.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.god.thirdLine.common.PageResult;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.domain.dto.MusicDTO;
import com.god.thirdLine.domain.entity.Music;
import com.god.thirdLine.domain.query.MusicQuery;
import com.god.thirdLine.domain.vo.MusicVO;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.mapper.MusicMapper;
import com.god.thirdLine.service.IMusicService;
import com.god.thirdLine.util.OssUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * <p>
 * 音乐表 服务实现类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-10-01
 */
@Service
@RequiredArgsConstructor
public class MusicServiceImpl extends ServiceImpl<MusicMapper, Music> implements IMusicService {

    /** 上架状态 */
    private static final int STATUS_ENABLED = 1;

    private final OssUtil ossUtil;

    @Override
    public Long saveMusic(MusicDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getTitle())) {
            throw new BusinessException(ResultCode.MUSIC_TITLE_REQUIRED);
        }
        if (!StringUtils.hasText(dto.getAudioUrl())) {
            throw new BusinessException(ResultCode.MUSIC_AUDIO_REQUIRED);
        }
        LocalDateTime now = LocalDateTime.now();
        Music music = new Music()
                .setTitle(dto.getTitle())
                .setArtist(dto.getArtist())
                .setCoverImage(dto.getCoverImage())
                .setAudioUrl(dto.getAudioUrl())
                .setStatus(dto.getStatus() == null ? STATUS_ENABLED : dto.getStatus())
                .setCreateTime(now)
                .setUpdateTime(now);
        // sort 未指定时自增追加到末尾（当前最大 sort + 1）
        music.setSort(dto.getSort() == null ? nextSort() : dto.getSort());
        this.save(music);
        return music.getId();
    }

    @Override
    public void updateMusic(MusicDTO dto) {
        if (dto == null || dto.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "音乐ID不能为空");
        }
        Music music = this.getById(dto.getId());
        if (music == null) {
            throw new BusinessException(ResultCode.MUSIC_NOT_FOUND);
        }
        // 各字段按需覆盖
        if (StringUtils.hasText(dto.getTitle())) {
            music.setTitle(dto.getTitle());
        }
        if (dto.getArtist() != null) {
            music.setArtist(dto.getArtist());
        }
        if (dto.getCoverImage() != null) {
            music.setCoverImage(dto.getCoverImage());
        }
        if (StringUtils.hasText(dto.getAudioUrl())) {
            music.setAudioUrl(dto.getAudioUrl());
        }
        if (dto.getSort() != null) {
            music.setSort(dto.getSort());
        }
        if (dto.getStatus() != null) {
            music.setStatus(dto.getStatus());
        }
        music.setUpdateTime(LocalDateTime.now());
        this.updateById(music);
    }

    @Override
    public void deleteMusic(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "音乐ID不能为空");
        }
        Music music = this.getById(id);
        if (music == null) {
            throw new BusinessException(ResultCode.MUSIC_NOT_FOUND);
        }
        this.removeById(id);
        // 同步清理 OSS 上的音频与封面（手填外链自动跳过）
        ossUtil.deleteByUrl(music.getAudioUrl());
        ossUtil.deleteByUrl(music.getCoverImage());
    }

    @Override
    public MusicVO getMusicDetail(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "音乐ID不能为空");
        }
        Music music = this.getById(id);
        if (music == null) {
            throw new BusinessException(ResultCode.MUSIC_NOT_FOUND);
        }
        return toVO(music);
    }

    @Override
    public PageResult<MusicVO> pageMusics(MusicQuery query) {
        if (query == null) {
            query = new MusicQuery();
        }
        String keyword = query.getKeyword();
        Page<Music> page = new Page<>(query.getPage(), query.getSize());
        Page<Music> result = this.page(page, Wrappers.<Music>lambdaQuery()
                .eq(query.getStatus() != null, Music::getStatus, query.getStatus())
                .and(StringUtils.hasText(keyword), w -> w
                        .like(Music::getTitle, keyword)
                        .or()
                        .like(Music::getArtist, keyword))
                .orderByAsc(Music::getSort)
                .orderByDesc(Music::getId));
        List<MusicVO> records = result.getRecords().stream()
                .map(this::toVO)
                .collect(Collectors.toList());
        return new PageResult<>(records, result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public List<MusicVO> listEnabledMusics() {
        List<Music> musics = this.list(Wrappers.<Music>lambdaQuery()
                .eq(Music::getStatus, STATUS_ENABLED)
                .orderByAsc(Music::getSort)
                .orderByAsc(Music::getId));
        return musics.stream().map(this::toVO).collect(Collectors.toList());
    }

    /**
     * 计算新增音乐的排序权重：当前最大 sort + 1，无数据时从 1 开始
     */
    private int nextSort() {
        Music last = this.getOne(Wrappers.<Music>lambdaQuery()
                .orderByDesc(Music::getSort)
                .last("LIMIT 1"));
        if (last == null || last.getSort() == null) {
            return 1;
        }
        return last.getSort() + 1;
    }

    private MusicVO toVO(Music music) {
        MusicVO vo = new MusicVO();
        BeanUtils.copyProperties(music, vo);
        return vo;
    }
}
