package com.god.thirdLine.service;

import com.god.thirdLine.common.RedisKeys;
import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EmailCodeServiceTest {

    private final MailService mailService = mock(MailService.class);
    private final StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
    private EmailCodeService service;

    @BeforeEach
    void setUp() {
        service = new EmailCodeService(mailService, redisTemplate);
        ReflectionTestUtils.setField(service, "subject", "注册验证码");
        ReflectionTestUtils.setField(service, "expireMinutes", 5L);
        ReflectionTestUtils.setField(service, "sendIntervalSeconds", 60L);
        when(mailService.isConfigured()).thenReturn(true);
    }

    @Test
    void storesCodeWithConfiguredTtlsBeforeQueuingMail() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class))).thenReturn(1L);
        when(mailService.sendAsync(anyString(), anyString(), anyString())).thenReturn(true);

        service.sendCode("user@example.com");

        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        var order = inOrder(redisTemplate, mailService);
        order.verify(redisTemplate).execute(any(RedisScript.class), eq(keys()), code.capture(),
                eq("300000"), anyString(), eq("60000"));
        assertTrue(code.getValue().matches("[0-9]{6}"));
        order.verify(mailService).sendAsync(eq("user@example.com"), eq("注册验证码"),
                contains(code.getValue()));
    }

    @Test
    void rateLimitedRequestDoesNotQueueMail() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class))).thenReturn(0L);

        assertError(ResultCode.EMAIL_CODE_SEND_TOO_FREQUENT, () -> service.sendCode("user@example.com"));

        verify(mailService, never()).sendAsync(anyString(), anyString(), anyString());
    }

    @Test
    void rejectedMailSubmissionRollsBackOnlyItsOwnRequest() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class))).thenReturn(1L);
        when(mailService.sendAsync(anyString(), anyString(), anyString())).thenReturn(false);

        assertError(ResultCode.EMAIL_SEND_FAILED, () -> service.sendCode("user@example.com"));

        ArgumentCaptor<String> requestId = ArgumentCaptor.forClass(String.class);
        var order = inOrder(redisTemplate, mailService);
        order.verify(redisTemplate).execute(any(RedisScript.class), eq(keys()), anyString(),
                eq("300000"), requestId.capture(), eq("60000"));
        order.verify(mailService).sendAsync(anyString(), anyString(), anyString());
        order.verify(redisTemplate).execute(any(RedisScript.class), eq(keys()), eq(requestId.getValue()));
    }

    @Test
    void verifiesAndConsumesCodeInOneRedisOperation() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class))).thenReturn(1L);

        service.verifyCode("user@example.com", "012345");

        verify(redisTemplate).execute(any(RedisScript.class), eq(List.of(keys().getFirst())), eq("012345"));
        verifyNoMoreInteractions(redisTemplate);
    }

    @Test
    void wrongExpiredOrConsumedCodeIsRejected() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(Object[].class))).thenReturn(0L);

        assertError(ResultCode.EMAIL_CODE_ERROR, () -> service.verifyCode("user@example.com", "012345"));
    }

    @Test
    void invalidInputDoesNotAccessRedis() {
        assertError(ResultCode.PARAM_ERROR, () -> service.sendCode("invalid-email"));
        assertError(ResultCode.EMAIL_CODE_ERROR, () -> service.verifyCode(null, "012345"));
        assertError(ResultCode.EMAIL_CODE_ERROR, () -> service.verifyCode("user@example.com", null));
        assertError(ResultCode.EMAIL_CODE_ERROR, () -> service.verifyCode("user@example.com", " "));

        verifyNoInteractions(redisTemplate);
    }

    @Test
    void unconfiguredMailDoesNotCreateCode() {
        when(mailService.isConfigured()).thenReturn(false);

        assertError(ResultCode.EMAIL_SEND_FAILED, () -> service.sendCode("user@example.com"));

        verifyNoInteractions(redisTemplate);
    }

    private List<String> keys() {
        return List.of(RedisKeys.registerEmailCode("user@example.com"),
                RedisKeys.registerEmailCodeInterval("user@example.com"));
    }

    private void assertError(ResultCode expected, Runnable action) {
        BusinessException exception = assertThrows(BusinessException.class, action::run);
        assertEquals(expected.getCode(), exception.getCode());
    }
}
