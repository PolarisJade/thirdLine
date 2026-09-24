
-- ------------------------------------------------------------
-- 1. 作品集主表：一条记录 = 一个作品/项目案例
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tl_portfolio` (
  `id`             bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title`          varchar(200)  COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '作品标题',
  `summary`        varchar(500)  COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '作品摘要（列表卡片展示）',
  `cover_image`    varchar(500)  COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '封面图URL',
  `tech_stack`     varchar(255)  COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '技术栈/工具，逗号分隔，如 React,Spring Boot,MySQL',
  `role`           varchar(100)  COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '本人担任角色，如 前端负责人/独立开发',
  `period`         varchar(50)   COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '项目周期，如 2025-01 ~ 2025-06',
  `demo_url`       varchar(500)  COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '在线演示地址',
  `repo_url`       varchar(500)  COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '源码仓库地址',
  `status`         tinyint       NOT NULL DEFAULT '0' COMMENT '状态：0草稿/1已发布/2已删除',
  `publish_time` datetime      DEFAULT NULL COMMENT '发布时间',
  `create_time`   datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`   datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status_pub` (`status`, `publish_time` DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT ='作品集表';
