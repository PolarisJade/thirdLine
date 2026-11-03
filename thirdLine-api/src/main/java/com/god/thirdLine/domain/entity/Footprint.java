package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.experimental.Accessors;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 足迹城市。一城一条，city_code 唯一。
 *
 * @author ParlisJade
 */
@Data
@Accessors(chain = true)
@TableName("tl_footprint")
public class Footprint {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 市级行政区划代码，如 420100 */
    private String cityCode;

    /** 城市名称快照，如 武汉市 */
    private String cityName;

    /** 所属省级行政区划代码，如 420000 */
    private String provinceCode;

    /** 所属省级行政区名称快照，如 湖北省 */
    private String provinceName;

    /** 首次/代表性到访日期，可为空 */
    private LocalDate visitDate;

    /** 城市评价，纯文本 */
    private String content;

    /** 0 草稿 / 1 已发布 */
    private Integer publishStatus;

    /** 0 隐藏 / 1 显示 */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
