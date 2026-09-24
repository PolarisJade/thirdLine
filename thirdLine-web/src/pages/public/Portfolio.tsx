import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import {
  Books,
  Briefcase,
  Calendar,
  SpinnerGap,
  GithubLogo,
  Link as LinkIcon,
  User,
} from '@phosphor-icons/react'
import { listPublishedPortfolios } from '@/api/portfolio'
import { formatDate } from '@/utils/format'
import Pill from '@/components/Pill'
import type { PortfolioVO } from '@/types'

/** 技术栈逗号分隔字符串转数组（去空白、去空项） */
const parseTechStack = (raw?: string | null): string[] =>
  (raw || '')
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean)

/** 作品集：已发布作品卡片网格，点击弹窗查看详情与演示 / 源码链接 */
export default function Portfolio() {
  const [list, setList] = useState<PortfolioVO[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PortfolioVO | null>(null)

  useEffect(() => {
    listPublishedPortfolios()
      .then((data) => setList(data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <SpinnerGap size={28} className="animate-spin text-muted" />
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 px-6 py-40 text-center">
        <Briefcase size={40} weight="thin" className="text-muted" />
        <h1 className="font-serif text-3xl font-semibold text-ink">还没有公开的作品</h1>
        <p className="text-sm text-muted">后台发布第一个作品后，就会在这里展示。</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Portfolio</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tightest text-ink">作品集</h1>
        <p className="mt-3 text-sm text-muted">这里是我参与和主导的一些项目，点击卡片查看详情。</p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {list.map((item) => {
          const techs = parseTechStack(item.techStack)
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setSelected(item)}
              className="mui-card group overflow-hidden !rounded-xl bg-canvas text-left transition hover:-translate-y-0.5"
            >
              {item.coverImage ? (
                <div className="aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center bg-surface">
                  <Books size={28} weight="thin" className="text-muted" />
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-lg font-semibold text-ink">{item.title}</h2>
                  {item.period && (
                    <span className="mt-0.5 shrink-0 font-mono text-xs text-muted">{item.period}</span>
                  )}
                </div>

                {item.summary && (
                  <p className="mt-2 line-clamp-2 text-sm text-charcoal">{item.summary}</p>
                )}

                {techs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {techs.map((t) => (
                      <Pill key={t} label={t} seed={t} />
                    ))}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        width={680}
        centered
        destroyOnClose
      >
        {selected && (
          <div>
            {selected.coverImage && (
              <div className="mb-5 overflow-hidden rounded-lg">
                <img src={selected.coverImage} alt={selected.title} className="w-full object-cover" />
              </div>
            )}
            <h2 className="font-serif text-2xl font-semibold text-ink">{selected.title}</h2>

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
              {selected.role && (
                <span className="flex items-center gap-1.5">
                  <User size={15} /> {selected.role}
                </span>
              )}
              {selected.period && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} /> {selected.period}
                </span>
              )}
              {selected.publishTime && (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={15} /> {formatDate(selected.publishTime)}
                </span>
              )}
            </div>

            {selected.summary && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-charcoal">
                {selected.summary}
              </p>
            )}

            {parseTechStack(selected.techStack).length > 0 && (
              <div className="mt-5">
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">技术栈</p>
                <div className="flex flex-wrap gap-1.5">
                  {parseTechStack(selected.techStack).map((t) => (
                    <Pill key={t} label={t} seed={t} />
                  ))}
                </div>
              </div>
            )}

            {(selected.demoUrl || selected.repoUrl) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {selected.demoUrl && (
                  <a
                    href={selected.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mui-btn-primary inline-flex items-center gap-1.5 !rounded-md !px-4 !py-1.5 text-sm"
                  >
                    <LinkIcon size={16} /> 在线演示
                  </a>
                )}
                {selected.repoUrl && (
                  <a
                    href={selected.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 !rounded-md border border-line bg-surface px-4 py-1.5 text-sm text-charcoal transition hover:border-charcoal"
                  >
                    <GithubLogo size={16} /> 源码仓库
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
