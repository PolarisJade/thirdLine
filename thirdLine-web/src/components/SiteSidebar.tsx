import { useEffect, useState } from 'react'
import { EnvelopeIcon, GithubLogoIcon } from '@phosphor-icons/react'
import { getSiteProfile, getSiteStats } from '@/api/site'
import type { SiteProfileVO, SiteStatsVO } from '@/types'

/** 数字指标网格：站点统计使用，每格展示一个数值指标 */
function StatGrid({ items }: { items: { label: string; value: number | string | null | undefined }[] }) {
    return (
        <div className="grid grid-cols-4 gap-2 text-center">
            {items.map((item) => (
                <div key={item.label} className="rounded-lg bg-bone py-3">
                    <p className="font-serif text-2xl font-semibold text-ink">{item.value ?? '—'}</p>
                    <p className="mt-1 text-xs text-muted">{item.label}</p>
                </div>
            ))}
        </div>
    )
}

/** 解析 yyyy-MM-dd 为本地零点，避免 new Date(字符串) 按 UTC 解析产生时区偏差 */
function parseStartDate(text: string): Date | null {
    const [y, m, d] = text.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
}

/** 首页右侧栏：博主个人介绍 + 网站基本信息统计 + 本站运行时间 */
export default function SiteSidebar() {
    const [stats, setStats] = useState<SiteStatsVO | null>(null)
    const [profile, setProfile] = useState<SiteProfileVO | null>(null)
    // 本站已运行天数，起始日期来自后端配置（tl.host.start_time）
    const [days, setDays] = useState<number | null>(null)

    useEffect(() => {
        getSiteStats()
            .then(setStats)
            .catch(() => setStats(null))
        // 站主信息从后端配置文件（tl.host.*）获取
        getSiteProfile()
            .then(setProfile)
            .catch(() => setProfile(null))
    }, [])

    // 站点运行计时：按分钟检查一次，跨天自动更新；配置缺失时不展示
    useEffect(() => {
        const start = profile?.startTime ? parseStartDate(profile.startTime) : null
        if (!start) return
        const tick = () => {
            const total = Date.now() - start.getTime()
            if (total < 0) return
            setDays(Math.floor(total / 86400000))
        }
        tick()
        const timer = window.setInterval(tick, 60 * 1000)
        return () => window.clearInterval(timer)
    }, [profile?.startTime])

    return (
        <div className="flex flex-col gap-6">
            {/* 博主介绍：配置未就绪时不展示 */}
            {profile && (
                <div className="mui-card p-5">
                    <div className="flex items-center gap-3">
                        <img
                            src={profile.avatar}
                            alt={profile.nickname}
                            className="h-14 w-14 rounded-full border border-line object-cover"
                        />
                        <div className="min-w-0">
                            <p className="truncate font-serif text-lg font-semibold text-ink">{profile.nickname}</p>
                            <a
                              href={`mailto:${profile.email}`}
                              className="flex items-center gap-1.5 truncate font-mono text-xs text-muted hover:text-ink"
                            >
                              <EnvelopeIcon size={13} />
                              {profile.email}
                            </a>
                        </div>
                    </div>
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noreferrer"
                      className="mui-btn-primary mt-4 flex w-full items-center justify-center gap-2 !bg-charcoal"
                    >
                      <GithubLogoIcon size={16} />
                      GitHub 主页
                    </a>
                </div>
            )}

            {/* 网站基本信息 */}
            <div className="mui-card p-5">
                <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">站点统计</p>
                <StatGrid
                    items={[
                        { label: '文章', value: stats?.articleCount },
                        { label: '分类', value: stats?.categoryCount },
                        { label: '标签', value: stats?.tagCount },
                        { label: '相册', value: stats?.photoCount },
                    ]}
                />
            </div>

            {/* 本站运行时间：起始日期来自后端配置（tl.host.start_time） */}
            {days !== null && (
                <div className="mui-card p-5">
                    <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">本站运行时间</p>
                    <div className="flex items-center justify-center gap-2 py-1">
                        <span className="text-sm text-charcoal">已运行</span>
                        <span className="rounded-md border border-[#346538]/15 bg-[#EDF3EC]/70 px-3 py-1 font-serif text-lg font-semibold leading-none text-[#346538] shadow-[0_1px_4px_rgba(52,101,56,0.10),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm">
                            {days}天
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}