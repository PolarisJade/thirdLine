package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.experimental.Accessors;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@TableName("tl_site_history")
public class SiteHistory {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String description;
    private LocalDate updateDate;
    private String version;
    private Integer updateType;
    private Integer publishStatus;
    private Integer status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}

