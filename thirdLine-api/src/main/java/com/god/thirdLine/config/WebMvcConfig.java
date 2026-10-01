package com.god.thirdLine.config;

import com.god.thirdLine.interceptor.JwtInterceptor;
import com.god.thirdLine.interceptor.UserJwtInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置：注册 JWT 拦截器与跨域策略
 *
 * @author ParlisJade
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final JwtInterceptor jwtInterceptor;
    private final UserJwtInterceptor userJwtInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 仅拦截后台管理命名空间；前台公开接口 /user/** 不注册拦截器，天然放行
        registry.addInterceptor(jwtInterceptor)
                .addPathPatterns("/admin/**");
        // 前台需登录才能访问的接口：发送/举报弹幕，以及登录态校验
        registry.addInterceptor(userJwtInterceptor)
                .addPathPatterns("/user/danmaku/send", "/user/danmaku/report", "/user/user/info");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                // 放行自定义续期响应头，允许前端 JS 读取 X-Refresh-Token
                .exposedHeaders("X-Refresh-Token")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
