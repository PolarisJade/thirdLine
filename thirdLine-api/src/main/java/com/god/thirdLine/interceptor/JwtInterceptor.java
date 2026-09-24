package com.god.thirdLine.interceptor;

import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.config.JwtProperties;
import com.god.thirdLine.context.UserContext;
import com.god.thirdLine.domain.entity.User;
import com.god.thirdLine.exception.BusinessException;
import com.god.thirdLine.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT 登录拦截器。
 * <p>
 * 仅注册在后台管理命名空间 {@code /admin/**} 上：访问管理端的读、写接口
 * 均必须携带有效 token，且 token 中的角色必须为管理员（仅放行跨域预检
 * OPTIONS 请求）；前台公开接口位于 {@code /user/**}，不进入本拦截器。
 *
 * @author ParlisJade
 */
@Component
@RequiredArgsConstructor
public class JwtInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final JwtProperties jwtProperties;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 跨域预检请求（OPTIONS）直接放行，其余（含 GET）均需校验 token
        String method = request.getMethod();
        if (HttpMethod.OPTIONS.matches(method)) {
            return true;
        }

        String headerValue = request.getHeader(jwtProperties.getHeader());
        String token = jwtUtil.resolveToken(headerValue);
        if (token == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }

        // 解析并校验 token（签名错误 / 已过期均会抛异常，统一转为 401）
        Claims claims;
        try {
            claims = jwtUtil.parseToken(token);
        } catch (Exception e) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        Object userIdClaim = claims.get("userId");
        Long userId = userIdClaim == null ? null : Long.valueOf(userIdClaim.toString());
        if (userId == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }

        // 本拦截器只拦 /admin/**，非管理员角色（role != 0）的 token 一律拒绝
        Integer role = jwtUtil.getRole(claims);
        if (!User.ROLE_ADMIN.equals(role)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "无管理后台权限");
        }

        // 滑动续期：剩余有效期不足阈值时签发新 token（保留角色声明），通过响应头返回给前端更新
        if (jwtUtil.needRefresh(claims)) {
            String newToken = jwtUtil.generateToken(userId, jwtUtil.getUsername(claims), role);
            response.setHeader(jwtProperties.getRefreshHeader(), newToken);
        }

        // 校验通过，写入上下文供后续业务使用
        UserContext.setUserId(userId);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // 请求结束后清理 ThreadLocal，避免线程复用导致的数据串号 / 内存泄漏
        UserContext.clear();
    }
}
