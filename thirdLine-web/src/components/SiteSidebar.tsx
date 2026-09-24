import { useEffect, useState } from 'react'
import { EnvelopeIcon, GithubLogoIcon } from '@phosphor-icons/react'
import { getSiteProfile, getSiteStats } from '@/api/site'
import type { SiteProfileVO, SiteStatsVO } from '@/types'

/** 首页右侧栏：博主个人介绍 + 网站基本信息统计 */
export default function SiteSidebar() {
    const [stats, setStats] = useState<SiteStatsVO | null>(null)
    const [profile, setProfile] = useState<SiteProfileVO | null>(null)

    useEffect(() => {
        getSiteStats()
            .then(setStats)
            .catch(() => setStats(null))
        // 站主信息从后端配置文件（tl.host.*）获取
        getSiteProfile()
            .then(setProfile)
            .catch(() => setProfile(null))
    }, [])

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
                <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                        { label: '文章', value: stats?.articleCount },
                        { label: '分类', value: stats?.categoryCount },
                        { label: '标签', value: stats?.tagCount },
                        { label: '相册', value: stats?.photoCount },
                    ].map((item) => (
                        <div key={item.label} className="rounded-lg bg-bone py-3">
                            <p className="font-serif text-2xl font-semibold text-ink">
                                {item.value ?? '—'}
                            </p>
                            <p className="mt-1 text-xs text-muted">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}