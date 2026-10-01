package com.god.thirdLine.interceptor;

import com.god.thirdLine.common.ResultCode;
import com.god.thirdLine.config.JwtProperties;
import com.god.thirdLine.context.UserContext;
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
 * 前台用户登录拦截器。
 * <p>
 * 仅注册在需要登录的前台写接口上（如发送 / 举报弹幕）：只要求携带有效 token
 * 并解析出 userId，<b>不校验管理员角色</b>，普通注册用户同样放行；
 * 与只拦 {@code /admin/**} 的 {@link JwtInterceptor} 区别在于此。
 * 浏览弹幕池等读接口不进入本拦截器，保持匿名可访问。
 *
 * @author ParlisJade
 */
@Component
@RequiredArgsConstructor
public class UserJwtInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final JwtProperties jwtProperties;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 跨域预检请求（OPTIONS）直接放行
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        String headerValue = request.getHeader(jwtProperties.getHeader());
        String token = jwtUtil.resolveToken(headerValue);
        if (token == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }

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

        // 滑动续期：与后台拦截器一致，登录用户前台写操作也能顺延 token 有效期
        if (jwtUtil.needRefresh(claims)) {
            String newToken = jwtUtil.generateToken(userId, jwtUtil.getUsername(claims), jwtUtil.getRole(claims));
            response.setHeader(jwtProperties.getRefreshHeader(), newToken);
        }

        UserContext.setUserId(userId);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
