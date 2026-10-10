import { useEffect, useRef, useState } from 'react'
import { musicApi, type MusicVO } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { EmptyState, Loading } from '@/components/Feedback'
import { cx } from '@/utils/format'
import { musicCover, withFallback } from '@/utils/placeholder'

/**
 * 音乐页。
 * 数据来自 GET /user/music/list（已上架音乐，按 sort 升序）。
 * 页面内置独立播放器；右下角全局悬浮播放器同样使用这份数据，两者互不干扰。
 */
export function MusicPage() {
  const { data, loading, error, reload } = useAsync(() => musicApi.list(), [])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const musics = data ?? []
  const current: MusicVO | undefined = musics[index]

  /* --------------------------------------------------------- 音频事件绑定 */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || 0)
    const onEnded = () =>
      setIndex((prev) => {
        if (prev + 1 < musics.length) return prev + 1
        setPlaying(false)
        return 0
      })

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnded)
    }
  }, [musics.length])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  /**
   * 切换曲目：音频元素是常驻的，仅替换 src。
   * 注意不能把 audio 作为受控组件渲染 src，否则 React 会重建元素导致播放中断。
   */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return

    audio.src = current.audioUrl
    audio.load()
    setCurrentTime(0)
    setDuration(0)

    if (playing) void audio.play().catch(() => setPlaying(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.audioUrl])

  const togglePlay = (targetIndex?: number) => {
    const audio = audioRef.current
    if (!audio || musics.length === 0) return

    if (targetIndex !== undefined && targetIndex !== index) {
      setIndex(targetIndex)
      setPlaying(true)
      return
    }

    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      void audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false))
    }
  }

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (loading) return <Loading text="正在取出歌单…" />

  if (error) {
    return (
      <div className="container">
        <Glass className="panel">
          <EmptyState
            icon="alert"
            title="歌单加载失败"
            desc={error}
            action={
              <Button variant="primary" icon="refresh" onClick={reload}>
                重新加载
              </Button>
            }
          />
        </Glass>
      </div>
    )
  }

  if (musics.length === 0 || !current) {
    return (
      <div className="container">
        <div className="page__header">
          <h1 className="page__title">音乐</h1>
          <p className="page__desc">写代码时循环播放的那些歌</p>
        </div>
        <Glass className="panel">
          <EmptyState icon="music" title="歌单还是空的" desc="去管理后台上传第一首音乐吧。" />
        </Glass>
      </div>
    )
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="container">
      <audio ref={audioRef} />

      <div className="page__header">
        <h1 className="page__title">音乐</h1>
        <p className="page__desc">{musics.length} 首歌 · 写代码时循环播放的那些歌</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 'var(--space-5)', alignItems: 'start' }}>
        {/* --------------------------------------------------------- 播放器 */}
        <Glass variant="strong" radius="2xl" style={{ padding: 'var(--space-7)', overflow: 'hidden', position: 'relative' }}>
          {/* 模糊封面做背景 */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: -1,
              opacity: 0.22,
              backgroundImage: `url(${withFallback(current.coverImage, musicCover(current.id))})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px)',
            }}
          />

          <div className="row" style={{ gap: 'var(--space-6)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              className={cx('music-page__cover', playing && 'music-page__cover--spinning')}
              style={{ width: 176, height: 176 }}
            >
              <img src={withFallback(current.coverImage, musicCover(current.id))} alt={current.title} />
            </div>

            <div className="stack grow" style={{ gap: 'var(--space-3)', minWidth: 240 }}>
              <span className="badge">
                <Icon name="music" size={12} />
                正在播放
              </span>
              <h2 style={{ fontSize: 25, fontWeight: 800 }}>{current.title}</h2>
              <span className="text-muted">{current.artist || '未知艺术家'}</span>

              {/* 进度条 */}
              <div
                className="music-player__progress"
                style={{ margin: 'var(--space-4) 0 0', height: 4 }}
                onClick={(event) => {
                  const audio = audioRef.current
                  if (!audio || !duration) return
                  const rect = event.currentTarget.getBoundingClientRect()
                  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
                  audio.currentTime = ratio * duration
                }}
              >
                <div className="music-player__progress-fill" style={{ width: `${progress}%` }} />
                <div className="music-player__progress-thumb" style={{ left: `${progress}%` }} />
              </div>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 12, color: 'var(--text-tertiary)' }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* 控制区 */}
              <div className="row" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button type="button" className="music-player__btn" onClick={() => togglePlay((index - 1 + musics.length) % musics.length)} aria-label="上一首">
                  <Icon name="skipBack" size={19} />
                </button>
                <button
                  type="button"
                  className="music-player__btn music-player__btn--play"
                  style={{ width: 52, height: 52 }}
                  onClick={() => togglePlay()}
                  aria-label={playing ? '暂停' : '播放'}
                >
                  <Icon name={playing ? 'pause' : 'play'} size={21} filled={!playing} />
                </button>
                <button type="button" className="music-player__btn" onClick={() => togglePlay((index + 1) % musics.length)} aria-label="下一首">
                  <Icon name="skipForward" size={19} />
                </button>

                <span className="row" style={{ gap: 8, marginLeft: 'var(--space-4)' }}>
                  <button
                    type="button"
                    className="music-player__btn"
                    onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                    aria-label={volume > 0 ? '静音' : '取消静音'}
                  >
                    <Icon name={volume > 0 ? 'volume' : 'volumeMute'} size={17} />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    aria-label="音量"
                    style={{ width: 90, accentColor: 'var(--brand-500)' }}
                  />
                </span>
              </div>
            </div>
          </div>
        </Glass>

        {/* --------------------------------------------------------- 播放列表 */}
        <Glass variant="strong" radius="xl" className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="panel__toolbar">
            <h2 className="dash-panel__title" style={{ margin: 0, fontSize: 15 }}>
              <Icon name="list" size={16} />
              歌单
            </h2>
            <span className="grow" />
            <span className="text-xs text-muted">{musics.length} 首</span>
          </div>

          <div className="music-player__list" style={{ maxHeight: 520, borderTop: 'none' }}>
            {musics.map((music, itemIndex) => (
              <button
                type="button"
                key={music.id}
                className={cx('music-player__item', itemIndex === index && 'music-player__item--active')}
                onClick={() => togglePlay(itemIndex)}
              >
                <span className="music-player__item-index">
                  {itemIndex === index && playing ? <Icon name="volume" size={13} /> : itemIndex + 1}
                </span>
                <span className="music-player__item-text">
                  <span className="music-player__item-title">{music.title}</span>
                  <span className="music-player__item-artist">{music.artist || '未知艺术家'}</span>
                </span>
                {itemIndex === index && <Icon name="play" size={13} filled />}
              </button>
            ))}
          </div>
        </Glass>
      </div>
    </div>
  )
}
