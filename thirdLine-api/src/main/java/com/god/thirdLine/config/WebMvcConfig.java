package com.god.thirdLine.config;

import com.god.thirdLine.interceptor.JwtInterceptor;
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

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 仅拦截后台管理命名空间；前台公开接口 /user/** 不注册拦截器，天然放行
        registry.addInterceptor(jwtInterceptor)
                .addPathPatterns("/admin/**");
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
