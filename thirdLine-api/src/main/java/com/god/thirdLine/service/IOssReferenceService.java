package com.god.thirdLine.service;

/**
 * OSS 文件引用检查与旧文件清理。
 *
 * <p>业务侧更新记录时，如果某个图片 / 音频地址被替换或删除，旧文件就变成了没人引用的垃圾。
 * 这里提供"以数据库为准"的引用判断：只有确认全站都不再引用该地址时，才把它从 OSS 删除。</p>
 *
 * <p>设计要点：</p>
 * <ul>
 *   <li>只删本站 OSS 上的文件，手填的第三方外链自动跳过；</li>
 *   <li>数据库更新提交成功之后才删文件，避免事务回滚后"库里还指着旧地址、文件已被删"；</li>
 *   <li>清理失败只记日志，绝不影响正常的业务更新。</li>
 * </ul>
 *
 * @author ParlisJade
 */
public interface IOssReferenceService {

    /**
     * 判断某个文件地址是否仍被站内任意位置引用。
     * 覆盖：文章封面与正文内嵌图、相册原图、作品集封面、音乐封面与音频、用户头像、配置中的站主头像。
     *
     * @param url 文件访问 URL
     * @return 仍被引用返回 true；空值或已无人引用返回 false
     */
    boolean isReferenced(String url);

    /**
     * 记录更新后清理"被替换掉的旧文件"：同一个地址、空地址、第三方外链、
     * 以及仍被其它记录引用的地址都不会删除。
     *
     * @param oldUrl 更新前的旧地址
     * @param newUrl 更新后的新地址（把该字段清空时可为空）
     */
    void deleteIfUnused(String oldUrl, String newUrl);

    /**
     * 确认某个地址已无人引用时从 OSS 删除（不再与"新地址"比较，业务侧已自行判断它被移除了）。
     *
     * @param url 待清理的地址
     */
    void deleteIfUnused(String url);

    /**
     * 清理富文本更新时被删掉的正文图片：出现在旧正文、且新正文里已不存在的 OSS 文件。
     *
     * @param oldContent 更新前的正文 HTML
     * @param newContent 更新后的正文 HTML
     */
    void deleteUnusedFromContent(String oldContent, String newContent);
}
