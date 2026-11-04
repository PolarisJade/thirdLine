package com.god.thirdLine.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.experimental.Accessors;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@TableName("tl_daily_note")
public class DailyNote {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private LocalDate noteDate;
    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private String content;
    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private Integer mood;
    @TableField(updateStrategy = FieldStrategy.ALWAYS)
    private Integer weather;
    private Integer publishStatus;
    private LocalDateTime publishTime;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
