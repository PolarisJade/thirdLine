package com.god.thirdLine.service;

import com.god.thirdLine.common.RedisKeys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** 首页统计缓存失效：数据库变更提交后删除，下次查询时重建。 */
@Component
@Slf4j
@RequiredArgsConstructor
public class SiteStatsCache {

    private final StringRedisTemplate redisTemplate;

    /** 有事务时在提交后删除；无事务时由调用方在数据库写入成功后调用。 */
    public void evictAfterCommit() {
        if (TransactionSynchronizationManager.isActualTransactionActive()
                && TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    evict();
                }
            });
        } else {
            evict();
        }
    }

    private void evict() {
        try {
            redisTemplate.delete(RedisKeys.SITE_STATS);
        } catch (DataAccessException e) {
            // 数据库已提交，不将缓存故障误报为业务操作失败。
            log.warn("站点统计缓存删除失败，将等待缓存过期", e);
        }
    }
}
