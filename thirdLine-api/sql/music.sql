-- ============================================================
-- 音乐表 tl_music
-- 前台全局悬浮播放器的音乐列表；音频支持 OSS 上传地址或第三方外链
-- ============================================================
CREATE TABLE IF NOT EXISTS `tl_music` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '歌曲名',
  `artist` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '歌手/艺术家',
  `cover_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '封面图URL',
  `audio_url` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '音频文件URL（OSS 上传地址或第三方外链）',
  `sort` int NOT NULL DEFAULT '0' COMMENT '排序权重，越小越靠前',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：0下架/1上架',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_music_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='音乐表';
