import { useEffect, useRef, useState } from 'react'
import { Slider } from 'antd'
import {
  CaretDown,
  CaretRight,
  MusicNotes,
  Pause,
  Playlist,
  SkipBack,
  SkipForward,
  SpeakerHigh,
  SpeakerSlash,
} from '@phosphor-icons/react'
import { listEnabledMusics } from '@/api/music'
import type { MusicVO } from '@/types'

/** 秒数格式化为 mm:ss */
const fmtTime = (sec: number) => {
  if (!Number.isFinite(sec) || sec <= 0) return '00:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * 全局悬浮播放器：右下角迷你按钮，展开为播放面板（进度 / 音量 / 播放列表）。
 * 挂载于 PublicLayout，切换前台路由不中断播放；音乐列表为空时不渲染。
 */
export default function MusicPlayer() {
  const [list, setList] = useState<MusicVO[]>([])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showList, setShowList] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const current = list[index]

  // 拉取已上架音乐列表；播放器属增强体验，失败静默
  useEffect(() => {
    listEnabledMusics()
      .then((res) => setList(res || []))
      .catch(() => {})
  }, [])

  // 切歌（含列表首次到达）：换源并延续当前播放意图
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return
    audio.src = current.audioUrl
    setCurrentTime(0)
    setDuration(0)
    if (playing) {
      audio.play().catch(() => setPlaying(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.audioUrl])

  // 音量 / 静音同步
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = volume
      audio.muted = muted
    }
  }, [volume, muted])

  const doPlay = () => {
    const audio = audioRef.current
    if (!audio || !current) return
    setPlaying(true)
    audio.play().catch(() => setPlaying(false))
  }

  const doPause = () => {
    audioRef.current?.pause()
    setPlaying(false)
  }

  const toggle = () => (playing ? doPause() : doPlay())

  const next = () => {
    if (list.length < 2) return
    setIndex((i) => (i + 1) % list.length)
  }

  const prev = () => {
    if (list.length < 2) return
    setIndex((i) => (i - 1 + list.length) % list.length)
  }

  /** 点击播放列表：非当前曲目则切歌播放，当前曲目则切换播放/暂停 */
  const switchTo = (i: number) => {
    if (i === index) {
      toggle()
      return
    }
    if (!playing) setPlaying(true)
    setIndex(i)
  }

  /** 拖动 / 点击进度条：按百分比跳转 */
  const seek = (percent: number) => {
    const audio = audioRef.current
    if (audio && duration > 0) {
      audio.currentTime = (percent / 100) * duration
    }
  }

  if (!current) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      {/* 隐藏音频元素：由事件驱动进度 / 时长状态 */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={next}
      />

      <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
        {expanded ? (
          /* 展开面板 */
          <div className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-canvas shadow-lg">
            <div className="flex items-center gap-3 border-b border-line p-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-line bg-bone">
                {current.coverImage ? (
                  <img
                    src={current.coverImage}
                    alt={current.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted">
                    <MusicNotes size={20} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">{current.title}</div>
                <div className="truncate text-xs text-muted">{current.artist || '未知歌手'}</div>
              </div>
              <button
                type="button"
                title="收起"
                onClick={() => setExpanded(false)}
                className="shrink-0 cursor-pointer border-0 bg-transparent text-muted transition hover:text-ink"
              >
                <CaretDown size={16} />
              </button>
            </div>

            <div className="px-4 pt-3">
              <Slider
                min={0}
                max={100}
                step={0.1}
                value={progress}
                onChange={seek}
                tooltip={{ formatter: (v) => fmtTime(((v ?? 0) / 100) * duration) }}
              />
              <div className="-mt-2 flex justify-between font-mono text-[11px] text-muted">
                <span>{fmtTime(currentTime)}</span>
                <span>{fmtTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  title="上一首"
                  onClick={prev}
                  className="cursor-pointer border-0 bg-transparent text-muted transition hover:text-ink"
                >
                  <SkipBack size={18} weight="fill" />
                </button>
                <button
                  type="button"
                  title={playing ? '暂停' : '播放'}
                  onClick={toggle}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-ink text-canvas transition hover:opacity-80"
                >
                  {playing ? (
                    <Pause size={16} weight="fill" />
                  ) : (
                    <CaretRight size={16} weight="fill" />
                  )}
                </button>
                <button
                  type="button"
                  title="下一首"
                  onClick={next}
                  className="cursor-pointer border-0 bg-transparent text-muted transition hover:text-ink"
                >
                  <SkipForward size={18} weight="fill" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title={muted ? '取消静音' : '静音'}
                  onClick={() => setMuted((m) => !m)}
                  className="cursor-pointer border-0 bg-transparent text-muted transition hover:text-ink"
                >
                  {muted ? <SpeakerSlash size={16} /> : <SpeakerHigh size={16} />}
                </button>
                <Slider
                  className="!mx-1"
                  style={{ width: 64 }}
                  min={0}
                  max={100}
                  value={muted ? 0 : Math.round(volume * 100)}
                  onChange={(v) => {
                    setVolume(v / 100)
                    setMuted(false)
                  }}
                  tooltip={{ open: false }}
                />
                <button
                  type="button"
                  title="播放列表"
                  onClick={() => setShowList((s) => !s)}
                  className={`cursor-pointer border-0 bg-transparent transition hover:text-ink ${
                    showList ? 'text-ink' : 'text-muted'
                  }`}
                >
                  <Playlist size={16} />
                </button>
              </div>
            </div>

            {showList && (
              <div className="max-h-44 overflow-y-auto border-t border-line">
                {list.map((m, i) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => switchTo(i)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent px-3 py-2 text-left text-xs transition hover:bg-bone ${
                      i === index ? 'text-ink' : 'text-muted'
                    }`}
                  >
                    <span className="truncate">
                      {i + 1}. {m.title}
                      <span className="text-muted"> · {m.artist || '未知歌手'}</span>
                    </span>
                    {i === index && playing && (
                      <MusicNotes size={14} className="shrink-0 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 折叠态：右下角圆形按钮，播放中带旋转虚线环 */
          <button
            type="button"
            title="打开音乐播放器"
            onClick={() => setExpanded(true)}
            className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-0 bg-canvas text-ink shadow-subtle transition"
          >
            {playing && (
              <span
                className="absolute -inset-1 animate-spin rounded-full border border-dashed border-ink/30"
                style={{ animationDuration: '8s' }}
              />
            )}
            <MusicNotes size={20} weight="bold" />
          </button>
        )}
      </div>
    </>
  )
}
