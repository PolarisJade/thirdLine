package com.god.thirdLine.service;

import com.github.houbb.sensitive.word.bs.SensitiveWordBs;
import org.springframework.stereotype.Component;

/**
 * 敏感词校验服务。
 * <p>
 * 基于 houbb sensitive-word 内置 DFA 词库，词库随依赖打包在内存中，
 * 无需外部服务；{@link SensitiveWordBs} 线程安全且初始化较重，故单例复用。
 *
 * @author ParlisJade
 */
@Component
public class SensitiveWordService {

    private final SensitiveWordBs wordBs;

    public SensitiveWordService() {
        this.wordBs = SensitiveWordBs.newInstance()
                // 忽略大小写与全半角，减少绕过；关闭数字/邮箱等强校验以免误伤正常弹幕
                .ignoreCase(true)
                .ignoreWidth(true)
                .ignoreNumStyle(true)
                .enableNumCheck(false)
                .enableEmailCheck(false)
                .enableUrlCheck(false)
                .init();
    }

    /**
     * 文本是否包含敏感词
     */
    public boolean contains(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        return wordBs.contains(text);
    }
}
