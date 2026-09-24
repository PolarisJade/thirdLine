package com.god.thirdLine.util;

import com.god.thirdLine.config.JwtProperties;
import com.god.thirdLine.domain.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 生成与解析工具
 *
 * @author ParlisJade
 */
@Component
@RequiredArgsConstructor
public class JwtUtil {

    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_USERNAME = "username";
    private static final String CLAIM_ROLE = "role";

    private final JwtProperties jwtProperties;

    private SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 生成 token
     *
     * @param userId   用户ID
     * @param username 用户名
     * @param role     用户角色（0管理员/1普通用户），随 token 携带供拦截器鉴权
     */
    public String generateToken(Long userId, String username, Integer role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getExpiration());
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(CLAIM_USER_ID, userId)
                .claim(CLAIM_USERNAME, username)
                .claim(CLAIM_ROLE, role)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSecretKey())
                .compact();
    }

    /**
     * 解析 token，失败（签名错误/过期等）会抛出 JwtException
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 从 token 中获取用户ID，解析失败返回 null
     */
    public Long getUserId(String token) {
        try {
            Claims claims = parseToken(token);
            Object userId = claims.get(CLAIM_USER_ID);
            return userId == null ? null : Long.valueOf(userId.toString());
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 从 claims 中获取用户名，缺失时回退为空字符串
     */
    public String getUsername(Claims claims) {
        Object username = claims.get(CLAIM_USERNAME);
        return username == null ? "" : username.toString();
    }

    /**
     * 从 claims 中获取角色，缺失或无法解析（如升级前的字符串角色旧 token）时回退为普通用户
     */
    public Integer getRole(Claims claims) {
        Object role = claims.get(CLAIM_ROLE);
        if (role == null) {
            return User.ROLE_USER;
        }
        try {
            return Integer.valueOf(role.toString());
        } catch (NumberFormatException e) {
            return User.ROLE_USER;
        }
    }

    /**
     * 判断 token 剩余有效期是否已不足续期阈值（需要签发新 token）；
     * 已过期或无法解析时返回 false
     */
    public boolean needRefresh(Claims claims) {
        Date expiry = claims.getExpiration();
        if (expiry == null) {
            return false;
        }
        long remaining = expiry.getTime() - System.currentTimeMillis();
        return remaining < jwtProperties.getRefreshThreshold();
    }

    /**
     * 从请求头原始值中剥离前缀，得到纯 token
     */
    public String resolveToken(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            return null;
        }
        String prefix = jwtProperties.getTokenPrefix();
        if (prefix != null && !prefix.isBlank() && headerValue.startsWith(prefix)) {
            return headerValue.substring(prefix.length()).trim();
        }
        return headerValue.trim();
    }
}
