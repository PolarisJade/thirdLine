-- ============================================================================
-- 友链模块建表脚本（已按线上实际结构对齐）
-- 目标库：third_line        数据库版本：MySQL 8.0
-- 字符集：utf8mb4 / utf8mb4_unicode_ci
--
-- 与现有 tl_* 表保持一致的约定：
--   1. 表名前缀 tl_；主键 bigint unsigned 自增
--   2. 状态类字段统一 tinyint，取值范围与含义写进列 COMMENT
--   3. 时间字段统一 create_time / update_time，并由数据库默认值兜底
--      （应用侧另有 MetaObjectHandler 自动填充，两者互为备份）
--   4. 唯一索引前缀 uk_，普通索引前缀 idx_
--   5. 不引入外键约束，关联关系只在 COMMENT 里注明
--
-- 执行：mysql -uroot -p --default-character-set=utf8mb4 third_line < tl_friend_link.sql
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 友情链接表
--
-- 一张表同时承载「已展示友链」和「申请单」两种数据形态：
--   * 管理员直接添加：source=0，audit_status=1，直接进入前台
--   * 访客提交申请：  source=1，audit_status=0，审核通过后才会出现在前台
-- 前台可见条件恒为：status = 1 AND audit_status = 1
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tl_friend_link` (
  `id`            bigint unsigned NOT NULL AUTO_INCREMENT                         COMMENT '主键',
  `name`          varchar(64)  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '站点名称',
  `url`           varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '站点地址（http/https，建议统一去掉尾部斜杠）',
  `avatar`        varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '站点图标/头像URL，为空时前台按域名首字母兜底',
  `description`   varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '站点描述/一句话简介',
  `email`         varchar(64)  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '申请人联系邮箱，仅后台可见，用于审核结果回信',
  `apply_user_id` bigint unsigned DEFAULT NULL                                    COMMENT '申请用户ID，关联 tl_user.id；管理员直接添加或访客未登录申请时为 NULL',
  `source`        tinyint NOT NULL DEFAULT '0'                                    COMMENT '来源：0管理员添加 1用户申请',
  `audit_status`  tinyint NOT NULL DEFAULT '0'                                    COMMENT '审核状态：0待审核 1已通过 2已拒绝',
  `reject_reason` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '拒绝原因，审核不通过时填写',
  `status`        tinyint NOT NULL DEFAULT '1'                                    COMMENT '显示状态：0隐藏 1显示（审核通过后的单独开关，用于临时下线）',
  `remark`        varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '后台内部备注，前台不展示',
  `audit_time`    datetime DEFAULT NULL                                           COMMENT '审核时间，通过/拒绝时写入',
  `create_time`   datetime NOT NULL DEFAULT CURRENT_TIMESTAMP                     COMMENT '创建时间',
  `update_time`   datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_url` (`url`),
  -- 后台待审核队列：WHERE audit_status = 0 ORDER BY create_time DESC
  KEY `idx_audit_status_time` (`audit_status`, `create_time`),
  -- 前台列表过滤：WHERE status = 1 AND audit_status = 1
  KEY `idx_status_audit` (`status`, `audit_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='友情链接表';


-- ---------------------------------------------------------------------------
-- 示例数据（确认可删）：用 INSERT IGNORE 配合 CREATE TABLE IF NOT EXISTS，
-- 保证脚本可重复执行，已存在的 url 会被 uk_url 挡掉
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO `tl_friend_link`
  (`name`, `url`, `description`, `source`, `audit_status`, `status`)
VALUES
  ('ThirdLine', 'https://github.com/PolarisJade', '本站作者的主页与开源仓库', 0, 1, 1),
  ('示例友链 A', 'https://example.com', '一句话介绍这个站点，控制在 20 字以内更好看', 0, 1, 1);


-- ---------------------------------------------------------------------------
-- 可选：友链申请的「须知」文案，复用现有站点配置表，无需新建表
-- ---------------------------------------------------------------------------
-- INSERT INTO `tl_site_config` (`config_key`, `config_value`, `description`) VALUES
--   ('friend_link_notice', '申请前请先在贵站添加本站友链，通过审核后将按提交顺序展示。', '友链申请须知，前台展示在申请表单上方');
