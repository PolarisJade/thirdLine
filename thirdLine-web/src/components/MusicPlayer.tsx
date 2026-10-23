import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { musicApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Icon } from './Icon'
import { cx } from '@/utils/format'
import { musicCover, withFallback } from '@/utils/placeholder'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  return `${Math.floor(seconds / 60)}`.padStart(2, '0') + ':' + `${Math.floor(seconds % 60)}`.padStart(2, '0')
}

/** 全局随身听：收起、展开和切换页面均不重建音频元素。 */
export function MusicPlayer() {
  const { data: musics } = useAsync(() => musicApi.list(), [])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [error, setError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [muted, setMuted] = useState(false)
  const [showList, setShowList] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playerRef = useRef<HTMLElement>(null)
  const listButtonRef = useRef<HTMLButtonElement>(null)
  const volumeButtonRef = useRef<HTMLButtonElement>(null)
  const playIntent = useRef(false)
  const playRequest = useRef(0)
  const listId = useId()
  const volumeId = useId()
  const list = musics ?? []
  const current = list[index]

  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    playIntent.current = true
    const request = ++playRequest.current
    setError(false)
    setBuffering(true)
    void audio.play().catch((reason: unknown) => {
      if (request !== playRequest.current) return
      playIntent.current = false
      setPlaying(false)
      setBuffering(false)
      setError(!(reason instanceof DOMException && reason.name === 'NotAllowedError'))
    })
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return
    ++playRequest.current
    setCurrentTime(0)
    setDuration(0)
    setError(false)
    setBuffering(false)
    audio.load()
    if (playIntent.current) play()
    return () => { ++playRequest.current }
  }, [current?.id, current?.audioUrl, play])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
    audioRef.current.muted = muted
  }, [volume, muted, current?.id])

  useEffect(() => {
    if (!showList && !showVolume) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !playerRef.current?.contains(event.target)) {
        setShowList(false)
        setShowVolume(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (showList) listButtonRef.current?.focus()
      else volumeButtonRef.current?.focus()
      setShowList(false)
      setShowVolume(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showList, showVolume])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playIntent.current) {
      playIntent.current = false
      ++playRequest.current
      audio.pause()
      setPlaying(false)
      setBuffering(false)
    } else {
      if (audio.error) audio.load()
      play()
    }
  }

  const selectTrack = (target: number, autoPlay = false) => {
    const audio = audioRef.current
    if (!audio) return
    if (target === index) {
      audio.currentTime = 0
      setCurrentTime(0)
      if (autoPlay || playIntent.current) play()
      return
    }
    if (autoPlay) playIntent.current = true
    setIndex(target)
  }

  if (!current) return null

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const audible = !muted && volume > 0
  const status = error ? '音频暂时无法播放，点击重试' : buffering ? '正在缓冲…' : playing ? '正在播放' : '让音乐陪你一会儿'

  return (
    <>
      <audio
        ref={audioRef}
        src={current.audioUrl}
        preload="metadata"
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration
          setDuration(Number.isFinite(value) ? value : 0)
        }}
        onPlaying={() => { setPlaying(true); setBuffering(false); setError(false) }}
        onPause={() => setPlaying(false)}
        onWaiting={() => { if (playIntent.current) setBuffering(true) }}
        onError={() => {
          ++playRequest.current
          playIntent.current = false
          setPlaying(false)
          setBuffering(false)
          setError(true)
        }}
        onEnded={() => {
          if (index + 1 < list.length) selectTrack(index + 1)
          else {
            playIntent.current = false
            setPlaying(false)
            selectTrack(0)
          }
        }}
      />

      <section ref={playerRef} aria-label="随身听音乐播放器" className={cx('music-player', collapsed && 'music-player--collapsed', playing && 'music-player--playing')}>
        {showList && !collapsed && (
          <section id={listId} className="music-player__queue" aria-label="播放列表">
            <div className="music-player__queue-heading">
              <span>播放列表 <span className="music-player__count">{list.length} 首</span></span>
              <button type="button" className="music-player__btn" onClick={() => { setShowList(false); listButtonRef.current?.focus() }} aria-label="关闭播放列表">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="music-player__list">
              {list.map((music, itemIndex) => (
                <button type="button" key={music.id} className={cx('music-player__item', itemIndex === index && 'music-player__item--active')} aria-current={itemIndex === index ? 'true' : undefined} onClick={() => selectTrack(itemIndex, true)}>
                  <span className="music-player__item-index">{itemIndex === index && playing ? <Icon name="volume" size={14} /> : `${itemIndex + 1}`.padStart(2, '0')}</span>
                  <img className="music-player__item-cover" src={withFallback(music.coverImage, musicCover(music.id))} alt="" loading="lazy" />
                  <span className="music-player__item-text">
                    <span className="music-player__item-title">{music.title}</span>
                    <span className="music-player__item-artist">{music.artist || '未知艺术家'}</span>
                  </span>
                  {itemIndex === index ? <span className="music-player__item-dot" aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
            <Link to="/music" className="music-player__all" onClick={() => setShowList(false)}>探索我的音乐收藏 <Icon name="arrowRight" size={14} /></Link>
          </section>
        )}

        <div className="music-player__shell">
          {!collapsed && (
            <div className="music-player__heading">
              <span className="music-player__label"><Icon name="music" size={13} /> 随身听</span>
              <span className="music-player__edition">MUSIC & LITTLE MOMENTS</span>
              <button type="button" className="music-player__btn music-player__collapse" onClick={() => { setCollapsed(true); setShowList(false); setShowVolume(false) }} aria-label="收起播放器" title="收起播放器"><Icon name="chevronDown" size={16} /></button>
            </div>
          )}

          <div className="music-player__record">
            <div className="music-player__artwork">
              <span className="music-player__vinyl" aria-hidden="true" />
              <img className="music-player__art" src={withFallback(current.coverImage, musicCover(current.id))} alt={`${current.title}的封面`} />
            </div>
            <div className="music-player__info">
              <span className="music-player__title" title={current.title}>{current.title}</span>
              <span className="music-player__artist" title={current.artist || '未知艺术家'}>{current.artist || '未知艺术家'}</span>
              {!collapsed && (
                <span className={cx('music-player__status', error && 'music-player__status--error')} role="status">
                  <span className="music-player__equalizer" aria-hidden="true"><i /><i /><i /><i /></span>{status}
                </span>
              )}
            </div>
            {collapsed && (
              <>
                <button type="button" className="music-player__btn music-player__btn--play" onClick={togglePlay} aria-label={playing || buffering ? '暂停' : '播放'} title={playing || buffering ? '暂停' : '播放'}><Icon name={playing || buffering ? 'pause' : 'play'} size={16} filled /></button>
                <button type="button" className="music-player__btn music-player__expand" onClick={() => setCollapsed(false)} aria-label="展开播放器" title="展开播放器"><Icon name="chevronUp" size={17} /></button>
              </>
            )}
          </div>

          {!collapsed && (
            <>
              <div className="music-player__timeline">
                <input type="range" className="music-player__range" min={0} max={duration || 1} step={0.1} value={Math.min(currentTime, duration || 1)} disabled={duration <= 0 || error} aria-label="播放进度" aria-valuetext={`${formatTime(currentTime)}，共 ${formatTime(duration)}`} style={{ '--range-progress': `${progress}%` } as CSSProperties}
                  onChange={(event) => {
                    const audio = audioRef.current
                    if (!audio) return
                    audio.currentTime = Number(event.target.value)
                    setCurrentTime(audio.currentTime)
                  }}
                />
                <div className="music-player__time"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
              </div>
              <div className="music-player__transport">
                <button ref={listButtonRef} type="button" className={cx('music-player__btn', showList && 'music-player__btn--active')} onClick={() => { setShowList(!showList); setShowVolume(false) }} aria-label="播放列表" title="播放列表" aria-expanded={showList} aria-controls={listId}><Icon name="list" size={19} /></button>
                <div className="music-player__controls">
                  <button type="button" className="music-player__btn" onClick={() => selectTrack((index - 1 + list.length) % list.length)} aria-label="上一首" title="上一首"><Icon name="skipBack" size={19} /></button>
                  <button type="button" className={cx('music-player__btn music-player__btn--play', buffering && 'music-player__btn--buffering')} onClick={togglePlay} aria-label={playing || buffering ? '暂停' : error ? '重试播放' : '播放'} title={playing || buffering ? '暂停' : error ? '重试播放' : '播放'}><Icon name={playing || buffering ? 'pause' : 'play'} size={22} filled /></button>
                  <button type="button" className="music-player__btn" onClick={() => selectTrack((index + 1) % list.length)} aria-label="下一首" title="下一首"><Icon name="skipForward" size={19} /></button>
                </div>
                <div className="music-player__volume">
                  <button ref={volumeButtonRef} type="button" className={cx('music-player__btn', showVolume && 'music-player__btn--active')} onClick={() => { setShowVolume(!showVolume); setShowList(false) }} aria-label="音量设置" title="音量设置" aria-expanded={showVolume} aria-controls={volumeId}><Icon name={audible ? 'volume' : 'volumeMute'} size={18} /></button>
                  {showVolume && (
                    <div id={volumeId} className="music-player__volume-panel" role="group" aria-label="音量设置">
                      <button type="button" className="music-player__btn" onClick={() => { if (!audible && volume === 0) setVolume(0.7); setMuted(audible) }} aria-label={audible ? '静音' : '取消静音'} title={audible ? '静音' : '取消静音'}><Icon name={audible ? 'volume' : 'volumeMute'} size={16} /></button>
                      <input type="range" className="music-player__range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={(event) => { setVolume(Number(event.target.value)); setMuted(false) }} aria-label="音量" style={{ '--range-progress': `${muted ? 0 : volume * 100}%` } as CSSProperties} />
                      <span>{Math.round(muted ? 0 : volume * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
