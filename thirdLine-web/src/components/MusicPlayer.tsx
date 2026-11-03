import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player'
import { musicApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Icon } from './Icon'
import { cx } from '@/utils/format'
import { musicCover, withFallback } from '@/utils/placeholder'

const playerLabels = {
  player: '音乐播放控制', progressControl: '播放进度', volumeControl: '音量',
  play: '播放', pause: '暂停', previous: '上一首', next: '下一首',
  volume: '静音', volumeMute: '取消静音', loop: '关闭单曲循环', loopOff: '开启单曲循环',
}

const playerIcons = {
  play: <Icon name="play" size={20} filled />,
  pause: <Icon name="pause" size={20} filled />,
  previous: <Icon name="skipBack" size={18} />,
  next: <Icon name="skipForward" size={18} />,
  volume: <Icon name="volume" size={17} />,
  volumeMute: <Icon name="volumeMute" size={17} />,
}

/** 复用 React H5 Audio Player；收起和跨页导航始终保留同一个音频元素。 */
export function MusicPlayer() {
  const { data: musics } = useAsync(musicApi.list, [])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [error, setError] = useState(false)
  const [showList, setShowList] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const player = useRef<AudioPlayer>(null)
  const playerRef = useRef<HTMLElement>(null)
  const listButtonRef = useRef<HTMLButtonElement>(null)
  const listId = useId()
  const list = musics ?? []
  const current = list[index]
  const playAfterChange = useRef(false)

  useEffect(() => {
    if (!showList) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !playerRef.current?.contains(event.target)) setShowList(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowList(false)
        listButtonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showList])

  const selectTrack = (target: number, autoPlay = false) => {
    const audio = player.current?.audio.current
    if (!audio || !list[target]) return
    playAfterChange.current = autoPlay || !audio.paused
    setError(false)
    setBuffering(false)
    // 同一个音源不会触发组件的 src 变更，手动复位并保留播放意图。
    if (list[target].audioUrl === current?.audioUrl) {
      audio.currentTime = 0
      if (playAfterChange.current) player.current?.playAudioPromise()
    }
    setIndex(target)
  }

  if (!current) return null

  const status = error ? '音频加载失败，点击播放重试' : buffering ? '正在缓冲…' : playing ? '正在播放' : '已暂停'

  return (
    <section
      ref={playerRef}
      aria-label="随身听音乐播放器"
      className={cx('music-player', collapsed && 'music-player--collapsed', playing && 'music-player--playing')}
    >
      {showList && !collapsed && (
        <section id={listId} className="music-player__queue" aria-label="播放列表">
          <header className="music-player__queue-heading">
            <h2>接下来播放 <span>{list.length} 首</span></h2>
            <button type="button" className="music-player__btn" onClick={() => { setShowList(false); listButtonRef.current?.focus() }} aria-label="关闭播放列表">
              <Icon name="close" size={17} />
            </button>
          </header>
          <div className="music-player__list">
            {list.map((music, itemIndex) => (
              <button
                type="button" key={music.id}
                className={cx('music-player__item', itemIndex === index && 'music-player__item--active')}
                aria-current={itemIndex === index ? 'true' : undefined}
                onClick={() => selectTrack(itemIndex, true)}
              >
                <span className="music-player__item-index">{itemIndex === index && playing ? <Icon name="volume" size={14} /> : `${itemIndex + 1}`.padStart(2, '0')}</span>
                <img className="music-player__item-cover" src={withFallback(music.coverImage, musicCover(music.id))} alt="" loading="lazy" />
                <span className="music-player__item-text">
                  <span className="music-player__item-title">{music.title}</span>
                  <span className="music-player__item-artist">{music.artist || '未知艺术家'}</span>
                </span>
                {itemIndex === index && <span className="music-player__item-dot" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <Link to="/music" className="music-player__all" onClick={() => setShowList(false)}>查看全部音乐 <Icon name="arrowRight" size={14} /></Link>
        </section>
      )}

      <div className="music-player__shell">
        <header className="music-player__track">
          <img className="music-player__art" src={withFallback(current.coverImage, musicCover(current.id))} alt={`${current.title}的封面`} />
          <div className="music-player__info">
            <span className="music-player__title" title={current.title}>{current.title}</span>
            <span className="music-player__artist" title={current.artist || '未知艺术家'}>{current.artist || '未知艺术家'}</span>
          </div>
          <button
            type="button" className="music-player__btn music-player__resize"
            aria-label={collapsed ? '展开播放器' : '收起播放器'} aria-expanded={!collapsed}
            title={collapsed ? '展开播放器' : '收起播放器'}
            onClick={() => { setCollapsed(!collapsed); setShowList(false) }}
          >
            <Icon name={collapsed ? 'chevronUp' : 'chevronDown'} size={17} />
          </button>
        </header>

        <AudioPlayer
          ref={player}
          className="music-player__audio"
          src={current.audioUrl}
          autoPlay={false}
          autoPlayAfterSrcChange={playAfterChange.current}
          preload="metadata"
          volume={0.7}
          layout="stacked-reverse"
          showSkipControls
          showJumpControls={false}
          showDownloadProgress={false}
          showFilledVolume
          progressUpdateInterval={250}
          defaultCurrentTime="00:00"
          defaultDuration="00:00"
          timeFormat="mm:ss"
          i18nAriaLabels={{ ...playerLabels, play: error ? '重试播放' : '播放' }}
          customIcons={playerIcons}
          customControlsSection={[
            RHAP_UI.MAIN_CONTROLS,
            RHAP_UI.VOLUME_CONTROLS,
            <button
              key="queue" ref={listButtonRef} type="button"
              className={cx('music-player__btn music-player__queue-toggle', showList && 'music-player__btn--active')}
              aria-label="播放列表" title="播放列表" aria-expanded={showList} aria-controls={listId}
              onClick={() => setShowList(!showList)}
            ><Icon name="list" size={19} /><span>{list.length}</span></button>,
          ]}
          onClickPrevious={() => selectTrack((index - 1 + list.length) % list.length)}
          onClickNext={() => selectTrack((index + 1) % list.length)}
          onPlay={() => { setPlaying(true); setError(false) }}
          onPlaying={() => { setPlaying(true); setBuffering(false); setError(false) }}
          onPause={() => { setPlaying(false); setBuffering(false) }}
          onWaiting={() => { if (!player.current?.audio.current?.paused) setBuffering(true) }}
          onError={() => { setPlaying(false); setBuffering(false); setError(true) }}
          onPlayError={() => { setPlaying(false); setBuffering(false); setError(true) }}
          onEnded={() => {
            if (index + 1 < list.length) selectTrack(index + 1, true)
            else {
              playAfterChange.current = false
              setPlaying(false)
              setIndex(0)
            }
          }}
        />

        <footer className="music-player__footer">
          <span className={cx('music-player__status', error && 'music-player__status--error')} role="status">
            <span className="music-player__equalizer" aria-hidden="true"><i /><i /><i /></span>{status}
          </span>
          <span className="music-player__collection">我的音乐收藏</span>
        </footer>
      </div>
    </section>
  )
}
