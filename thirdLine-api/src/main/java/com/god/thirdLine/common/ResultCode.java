package com.god.thirdLine.common;

import lombok.Getter;

/**
 * 统一响应状态码
 *
 * @author ParlisJade
 */
@Getter
public enum ResultCode {

    /* 通用 */
    SUCCESS(200, "success"),
    ERROR(500, "系统繁忙，请稍后再试"),
    PARAM_ERROR(400, "参数错误"),
    UNAUTHORIZED(401, "未登录或登录已失效"),
    FORBIDDEN(403, "没有操作权限"),

    /* 用户模块 1xxx */
    USER_NOT_FOUND(1001, "用户不存在"),
    PASSWORD_ERROR(1002, "账号或密码错误"),
    USER_DISABLED(1003, "账号已被禁用"),
    OLD_PASSWORD_ERROR(1004, "旧密码不正确"),
    SAME_PASSWORD(1005, "新密码不能与旧密码相同"),
    EMAIL_ALREADY_REGISTERED(1006, "该邮箱已被注册"),
    USERNAME_ALREADY_EXISTS(1007, "该用户名已被占用"),
    EMAIL_CODE_ERROR(1008, "验证码错误或已过期"),
    EMAIL_CODE_SEND_TOO_FREQUENT(1009, "验证码发送过于频繁，请稍后再试"),
    EMAIL_SEND_FAILED(1010, "验证邮件发送失败，请稍后再试"),

    /* 文章模块 2xxx */
    ARTICLE_NOT_FOUND(2001, "文章不存在"),
    CATEGORY_REQUIRED(2002, "文章必须指定所属分类"),
    CATEGORY_NOT_FOUND(2003, "分类不存在"),
    CATEGORY_NAME_DUPLICATE(2004, "分类名称已存在"),
    CATEGORY_IN_USE(2005, "分类下存在关联文章，无法删除"),

    /* 标签模块 3xxx */
    TAG_NOT_FOUND(3001, "标签不存在"),
    TAG_IN_USE(3002, "标签已关联文章，无法删除"),
    TAG_NAME_DUPLICATE(3003, "标签名称已存在"),

    /* 文件上传模块 4xxx */
    FILE_EMPTY(4001, "上传文件不能为空"),
    FILE_TYPE_NOT_ALLOWED(4002, "不支持的文件类型"),
    FILE_UPLOAD_ERROR(4003, "文件上传失败，请稍后再试"),
    
    /* 照片模块 5xxx */
    PHOTO_NOT_FOUND(5001, "照片不存在"),
    PHOTO_URL_REQUIRED(5002, "照片图片不能为空"),

    /* 作品集模块 6xxx */
    PORTFOLIO_NOT_FOUND(6001, "作品不存在"),
    PORTFOLIO_TITLE_REQUIRED(6002, "作品标题不能为空"),

    /* 技术栈字典 61xx（作品集子模块） */
    TECH_STACK_NOT_FOUND(6101, "技术栈不存在"),
    TECH_STACK_IN_USE(6102, "技术栈已关联作品，无法删除"),
    TECH_STACK_NAME_DUPLICATE(6103, "技术栈名称已存在"),

    /* 音乐模块 8xxx */
    MUSIC_NOT_FOUND(8001, "音乐不存在"),
    MUSIC_TITLE_REQUIRED(8002, "歌曲名不能为空"),
    MUSIC_AUDIO_REQUIRED(8003, "音频地址不能为空"),

    /* 友链模块 10xxx */
    FRIEND_LINK_NOT_FOUND(10001, "友链不存在"),
    FRIEND_LINK_NAME_REQUIRED(10002, "站点名称不能为空"),
    FRIEND_LINK_URL_REQUIRED(10003, "站点地址不能为空"),
    FRIEND_LINK_URL_INVALID(10004, "站点地址需以 http:// 或 https:// 开头"),
    FRIEND_LINK_URL_DUPLICATE(10005, "该站点地址已提交过，请勿重复申请"),
    FRIEND_LINK_SENSITIVE(10006, "内容含有敏感词，请修改后再提交"),
    FRIEND_LINK_AUDIT_STATUS_INVALID(10007, "审核结果只能是已通过或已拒绝"),
    FRIEND_LINK_REJECT_REASON_REQUIRED(10008, "拒绝时请填写拒绝原因"),
    FRIEND_LINK_APPLY_DISABLED(10009, "当前暂未开放友链申请");

    private final Integer code;
    private final String message;

    ResultCode(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}
