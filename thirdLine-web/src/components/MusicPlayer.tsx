import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { musicApi, type MusicVO } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Icon } from './Icon'
import { cx } from '@/utils/format'
import { musicCover, withFallback } from '@/utils/placeholder'

/** 秒 -> mm:ss */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
}

/**
 * 全局悬浮音乐播放器。
 * 数据来源：GET /user/music/list（已上架音乐，按 sort 升序）。
 * 使用原生 Audio 元素播放 OSS / 外链音频，支持上一首、下一首、拖动进度、播放列表。
 */
export function MusicPlayer() {
  const { data: musics } = useAsync(() => musicApi.list(), [])

  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showList, setShowList] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const list = musics ?? []
  const current: MusicVO | undefined = list[index]

  /* -------------------------------------------------------- 音频元素事件 */

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || 0)
    const onEnded = () => {
      // 播完自动下一首；到末尾则回到第一首并暂停
      setIndex((prev) => {
        if (prev + 1 < list.length) return prev + 1
        setPlaying(false)
        return 0
      })
    }
    const onError = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [list.length])

  /** 切换歌曲后：重置进度，若处于播放态则续播 */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return

    setCurrentTime(0)
    setDuration(0)
    audio.load()

    if (playing) {
      void audio.play().catch(() => setPlaying(false))
    }
    // 仅在曲目切换时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.audioUrl])

  /** 播放/暂停：浏览器要求由用户手势触发，因此只在点击回调里调用 play() */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !current) return

    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      void audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false))
    }
  }, [playing, current])

  const skip = useCallback(
    (delta: number) => {
      if (list.length === 0) return

      setIndex((prev) => {
        const next = (prev + delta + list.length) % list.length
        // 切歌后保持播放态
        window.setTimeout(() => {
          const audio = audioRef.current
          if (audio && playing) void audio.play().catch(() => setPlaying(false))
        }, 30)
        return next
      })
    },
    [list.length, playing],
  )

  const seek = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current
      const bar = progressRef.current
      if (!audio || !bar || !duration) return

      const rect = bar.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
      audio.currentTime = ratio * duration
      setCurrentTime(audio.currentTime)
    },
    [duration],
  )

  // 没有已上架音乐时不渲染播放器
  if (list.length === 0 || !current) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      <audio ref={audioRef} src={current.audioUrl} preload="metadata" />

      <div className={cx('music-player glass glass--strong', collapsed && 'music-player--collapsed')}>
        <div className="music-player__bar">
          <div className={cx('music-player__cover', playing && 'music-player__cover--spinning')}>
            <img src={withFallback(current.coverImage, musicCover(current.id))} alt={current.title} />
          </div>

          <div className="music-player__info">
            <span className="music-player__title" title={current.title}>
              {current.title}
            </span>
            <span className="music-player__artist">{current.artist || '未知艺术家'}</span>
          </div>

          <div className="music-player__controls">
            {!collapsed && (
              <>
                <button type="button" className="music-player__btn" onClick={() => skip(-1)} aria-label="上一首">
                  <Icon name="skipBack" size={15} />
                </button>
                <button
                  type="button"
                  className="music-player__btn music-player__btn--play"
                  onClick={togglePlay}
                  aria-label={playing ? '暂停' : '播放'}
                >
                  <Icon name={playing ? 'pause' : 'play'} size={16} filled={!playing} />
                </button>
                <button type="button" className="music-player__btn" onClick={() => skip(1)} aria-label="下一首">
                  <Icon name="skipForward" size={15} />
                </button>
                <button
                  type="button"
                  className="music-player__btn"
                  onClick={() => setShowList((prev) => !prev)}
                  aria-label="播放列表"
                  title="播放列表"
                >
                  <Icon name="list" size={16} />
                </button>
              </>
            )}
            <button
              type="button"
              className="music-player__btn"
              onClick={() => {
                setCollapsed((prev) => !prev)
                setShowList(false)
              }}
              aria-label={collapsed ? '展开播放器' : '收起播放器'}
              title={collapsed ? '展开播放器' : '收起播放器'}
            >
              <Icon name={collapsed ? 'chevronUp' : 'chevronDown'} size={16} />
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            <div className="music-player__progress" ref={progressRef} onClick={seek}>
              <div className="music-player__progress-fill" style={{ width: `${progress}%` }} />
              <div className="music-player__progress-thumb" style={{ left: `${progress}%` }} />
            </div>
            <div className="music-player__time">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {showList && (
              <div className="music-player__list">
                {list.map((music, itemIndex) => (
                  <button
                    type="button"
                    key={music.id}
                    className={cx('music-player__item', itemIndex === index && 'music-player__item--active')}
                    onClick={() => {
                      setIndex(itemIndex)
                      setPlaying(true)
                      // 等 src 更新后再播放
                      window.setTimeout(() => {
                        void audioRef.current?.play().catch(() => setPlaying(false))
                      }, 40)
                    }}
                  >
                    <span className="music-player__item-index">
                      {itemIndex === index && playing ? <Icon name="volume" size={13} /> : itemIndex + 1}
                    </span>
                    <span className="music-player__item-text">
                      <span className="music-player__item-title">{music.title}</span>
                      <span className="music-player__item-artist">{music.artist || '未知艺术家'}</span>
                    </span>
                  </button>
                ))}

                <div className="music-player__divider" />
                <Link
                  to="/music"
                  className="music-player__item"
                  style={{ fontSize: 13, color: 'var(--brand-600)', fontWeight: 600 }}
                >
                  <Icon name="arrowRight" size={14} />
                  前往音乐页查看全部
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
