package com.god.thirdLine.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 创建时间 / 更新时间自动填充。
 *
 * <p>配合实体上 {@code @TableField(fill = ...)} 使用：
 * 新增时补 createTime + updateTime，修改时刷新 updateTime，
 * 业务代码里不再手写 {@code LocalDateTime.now()}。</p>
 *
 * @author ParlisJade
 */
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {

    /** 通用时间字段（tl_photo / tl_friend_link 等） */
    private static final String CREATE_TIME = "createTime";
    private static final String UPDATE_TIME = "updateTime";

    /** tl_article 的历史命名，列为 created_time / updated_time */
    private static final String CREATED_TIME = "createdTime";
    private static final String UPDATED_TIME = "updatedTime";

    @Override
    public void insertFill(MetaObject metaObject) {
        LocalDateTime now = LocalDateTime.now();
        // strictInsertFill 只在字段为 null 时填充：调用方显式赋过值的不会被覆盖，
        // 实体上没有该字段时内部会自动跳过，因此四行可以无差别调用。
        strictInsertFill(metaObject, CREATE_TIME, LocalDateTime.class, now);
        strictInsertFill(metaObject, UPDATE_TIME, LocalDateTime.class, now);
        strictInsertFill(metaObject, CREATED_TIME, LocalDateTime.class, now);
        strictInsertFill(metaObject, UPDATED_TIME, LocalDateTime.class, now);
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        // 这里必须无条件覆盖，不能用 strictUpdateFill：
        // 业务上更新都是「先 getById 再改字段」，实体里的 updateTime 是数据库里的旧值（非 null），
        // strictUpdateFill 会因此跳过填充，最终把旧时间原样写回，update_time 就永远不刷新了。
        LocalDateTime now = LocalDateTime.now();
        setFieldValByName(UPDATE_TIME, now, metaObject);
        setFieldValByName(UPDATED_TIME, now, metaObject);
    }
}
