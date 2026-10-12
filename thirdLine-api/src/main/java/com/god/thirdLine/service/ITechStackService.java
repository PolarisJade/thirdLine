package com.god.thirdLine.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.god.thirdLine.domain.dto.TechStackDTO;
import com.god.thirdLine.domain.entity.TechStack;
import com.god.thirdLine.domain.vo.TechStackVO;

import java.util.List;

/**
 * <p>
 * 技术栈字典表 服务类
 * </p>
 *
 * @author ParlisJade
 * @since 2026-10-12
 */
public interface ITechStackService extends IService<TechStack> {

    /**
     * 新增技术栈（名称唯一，sort 为空时自动排到末尾）
     *
     * @param dto 技术栈数据
     * @return 新增技术栈ID
     */
    Long saveTechStack(TechStackDTO dto);

    /**
     * 修改技术栈（名称 / 排序 / 状态，均为按需覆盖）
     *
     * @param dto 技术栈数据
     */
    void updateTechStack(TechStackDTO dto);

    /**
     * 删除技术栈，若已关联作品则不允许删除
     *
     * @param id 技术栈ID
     */
    void deleteTechStack(Long id);

    /**
     * 查询全部技术栈（后台管理用，含禁用项）
     *
     * @return 技术栈列表
     */
    List<TechStackVO> listTechStacks();

    /**
     * 查询启用中的技术栈（前台展示与筛选用）
     *
     * @return 技术栈列表
     */
    List<TechStackVO> listEnabledTechStacks();
}
