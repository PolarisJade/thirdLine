package com.god.thirdLine.service;

import com.god.thirdLine.common.RedisKeys;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SiteStatsCacheTest {
    private final StringRedisTemplate redis = mock(StringRedisTemplate.class);
    private final SiteStatsCache cache = new SiteStatsCache(redis);
    private final TransactionTemplate transaction = new TransactionTemplate(new AbstractPlatformTransactionManager() {
        @Override
        protected Object doGetTransaction() { return new Object(); }

        @Override
        protected void doBegin(Object tx, TransactionDefinition definition) { }

        @Override
        protected void doCommit(DefaultTransactionStatus status) { }

        @Override
        protected void doRollback(DefaultTransactionStatus status) { }
    });

    @Test
    void deletesStatsKeyImmediatelyWhenNoTransactionExists() {
        cache.evictAfterCommit();
        verify(redis).delete(RedisKeys.SITE_STATS);
        verifyNoMoreInteractions(redis);
    }

    @Test
    void waitsUntilTransactionHasCommitted() {
        transaction.executeWithoutResult(status -> {
            cache.evictAfterCommit();
            verifyNoInteractions(redis);
        });
        verify(redis).delete(RedisKeys.SITE_STATS);
    }

    @Test
    void rolledBackTransactionDoesNotDeleteCache() {
        transaction.executeWithoutResult(status -> {
            cache.evictAfterCommit();
            status.setRollbackOnly();
        });
        verifyNoInteractions(redis);
    }

    @Test
    void exceptionRollsBackWithoutDeletingCache() {
        assertThrows(IllegalStateException.class, () -> transaction.executeWithoutResult(status -> {
            cache.evictAfterCommit();
            throw new IllegalStateException("Database write failed");
        }));
        verifyNoInteractions(redis);
    }

    @Test
    void cacheFailureDoesNotTurnCommittedOperationIntoFailure() {
        when(redis.delete(RedisKeys.SITE_STATS)).thenThrow(new DataAccessResourceFailureException("Redis unavailable"));
        assertDoesNotThrow(() -> transaction.executeWithoutResult(status -> cache.evictAfterCommit()));
        verify(redis).delete(RedisKeys.SITE_STATS);
    }
}
