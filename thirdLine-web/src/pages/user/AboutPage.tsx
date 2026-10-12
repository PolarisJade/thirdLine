import { Link } from 'react-router-dom'
import { siteApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Glass } from '@/components/Glass'
import { Icon } from '@/components/Icon'
import { Avatar } from '@/components/Form'
import { SectionHead } from '@/components/Feedback'
import { daysSince, formatDate, formatNumber } from '@/utils/format'
import { ABOUT_IMAGE, avatarPlaceholder, withFallback } from '@/utils/placeholder'

/** 技能标签：与后端无关，纯展示个人介绍；需要改内容直接改这里 */
const SKILLS = [
  'Java',
  'Spring Boot',
  'MyBatis-Plus',
  'MySQL',
  'Redis',
  'Vue / React',
  'TypeScript',
  'Docker',
  'Nginx',
  '阿里云 OSS',
]

const TIMELINE = [
  { year: '现在', title: 'AI辅助开发', desc: '这几年AI大模型发展十分迅速，准备学习AI对项目开发进行赋能。' },
  { year: '2025', title: 'Java开发', desc: '听说Java后端开发就业岗位多，于是我正式开始了学习Java' },
  { year: '2024', title: '大一', desc: '2024年，我正式开始了学习计算机。' },
]

/**
 * 关于页。
 * 站主信息来自 GET /user/site/profile（后端配置文件 tl.host.*），
 * 统计来自 GET /user/site/stats。
 */
export function AboutPage() {
  const { data: profile, loading } = useAsync(() => siteApi.profile(), [])
  const { data: stats } = useAsync(() => siteApi.stats(), [])

  const runningDays = daysSince(profile?.startTime)

  return (
    <div className="container">
      <div className="page__header">
        <h1 className="page__title">关于我</h1>
        <p className="page__desc">我应该算是个好人吧....或许并不是</p>
      </div>

      <div className="about-grid">
        {/* ---------------------------------------------------------- 名片 */}
        <Glass className="about-card" variant="strong">
          <Avatar size="xl" src={withFallback(profile?.avatar, avatarPlaceholder(profile?.nickname))} name={profile?.nickname} />
          <span className="about-card__name">{loading ? '加载中…' : profile?.nickname || 'PolarisJade'}</span>
          <span className="about-card__role">大学生 / 非遗剪纸爱好者</span>

          <p className="text-muted text-sm" style={{ lineHeight: 1.85, marginTop: 4 }}>
            唉！感觉好累啊，
            <br />
            感觉我的人生完蛋了....
          </p>

          <div className="about-card__contacts">
            {profile?.github && (
              <a href={profile.github} target="_blank" rel="noreferrer noopener" className="about-contact">
                <Icon name="github" size={16} />
                GitHub
                <span className="about-contact__value">@{profile.nickname || 'PolarisJade'}</span>
              </a>
            )}
            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="about-contact">
                <Icon name="mail" size={16} />
                邮箱
                <span className="about-contact__value">{profile.email}</span>
              </a>
            )}
            <span className="about-contact" style={{ cursor: 'default' }}>
              <Icon name="calendar" size={16} />
              建站日期
              <span className="about-contact__value">{formatDate(profile?.startTime)}</span>
            </span>
            <span className="about-contact" style={{ cursor: 'default' }}>
              <Icon name="clock" size={16} />
              已运行
              <span className="about-contact__value">{formatNumber(runningDays)} 天</span>
            </span>
          </div>
        </Glass>

        {/* ---------------------------------------------------------- 正文 */}
        <div className="stack" style={{ gap: 'var(--space-5)' }}>
          <Glass variant="strong" radius="xl" style={{ padding: 'var(--space-6)' }}>
            <SectionHead eyebrow="Hello" title="你好，很高兴认识你" />
            <div className="rich-text" style={{ fontSize: 15 }}>
              <p>
                我是 <strong>{profile?.nickname || 'PolarisJade'}</strong>，目前是一名软件工程大三在读学生。
              </p>
              <p>
                这个站点叫 <strong>thirdLine（第三行）</strong>，为什么叫这个名字呢？
                其实我也不知道，这个名字是我用AI想的，
                就我这脑袋根本想不出几个有意境的名字，虽然说感觉这个名字页不咋滴。但也将就着用吧。
              </p>
              <p>
                这个网站主要是记录一些我的学习、生活和日常。
                如果我写的一些文章能够帮助到你的话，我感到非常荣幸。
              </p>
            </div>
          </Glass>

          {/* 站点数据 */}
          <div className="stats-strip" style={{ marginTop: 0 }}>
            <Glass className="stat-card" hoverable>
              <span className="stat-card__icon">
                <Icon name="article" size={19} />
              </span>
              <span className="stat-card__value">{formatNumber(stats?.articleCount ?? 0)}</span>
              <span className="stat-card__label">文章</span>
            </Glass>
            <Glass className="stat-card" hoverable>
              <span className="stat-card__icon">
                <Icon name="folder" size={19} />
              </span>
              <span className="stat-card__value">{formatNumber(stats?.categoryCount ?? 0)}</span>
              <span className="stat-card__label">分类</span>
            </Glass>
            <Glass className="stat-card" hoverable>
              <span className="stat-card__icon">
                <Icon name="tag" size={19} />
              </span>
              <span className="stat-card__value">{formatNumber(stats?.tagCount ?? 0)}</span>
              <span className="stat-card__label">标签</span>
            </Glass>
            <Glass className="stat-card" hoverable>
              <span className="stat-card__icon">
                <Icon name="image" size={19} />
              </span>
              <span className="stat-card__value">{formatNumber(stats?.photoCount ?? 0)}</span>
              <span className="stat-card__label">照片</span>
            </Glass>
          </div>

          {/* 技能 */}
          <Glass variant="strong" radius="xl" style={{ padding: 'var(--space-6)' }}>
            <SectionHead eyebrow="Skills" title="常用的工具" />
            <div className="skill-cloud">
              {SKILLS.map((skill) => (
                <span className="tag-chip" key={skill}>
                  <Icon name="code" size={12} />
                  {skill}
                </span>
              ))}
            </div>
          </Glass>

          {/* 时间线 */}
          <Glass variant="strong" radius="xl" style={{ padding: 'var(--space-6)' }}>
            <SectionHead eyebrow="Journey" title="一点时间线" />
            <div className="timeline">
              {TIMELINE.map((item, index) => (
                <div className="row" key={item.year} style={{ gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                  <div className="stack" style={{ alignItems: 'center', gap: 6, paddingTop: 2 }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: index === 0 ? '#fff' : 'var(--brand-600)',
                        background:
                          index === 0
                            ? 'linear-gradient(135deg, var(--brand-400), var(--brand-600))'
                            : 'color-mix(in srgb, var(--brand-400) 15%, transparent)',
                        flexShrink: 0,
                      }}
                    >
                      {item.year}
                    </span>
                    {index < TIMELINE.length - 1 && (
                      <span style={{ width: 1, flex: 1, minHeight: 24, background: 'var(--line-strong)' }} />
                    )}
                  </div>
                  <div className="stack" style={{ gap: 2, paddingBottom: index < TIMELINE.length - 1 ? 'var(--space-4)' : 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</span>
                    <span className="text-muted text-sm" style={{ lineHeight: 1.75 }}>
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Glass>

          {/* 配图 + 快捷入口：图片完整展示，不裁切 */}
          <Glass variant="strong" radius="xl" style={{ overflow: 'hidden' }}>
            <img src={ABOUT_IMAGE} alt="" aria-hidden="true" style={{ width: '100%', display: 'block' }} />
            <div className="row wrap" style={{ gap: 12, padding: 'var(--space-5)' }}>
              <Link to="/articles" className="btn btn--primary">
                <Icon name="book" size={16} />
                阅读文章
              </Link>
              <Link to="/portfolio" className="btn btn--glass">
                <Icon name="grid" size={16} />
                看看作品
              </Link>
              {profile?.email && (
                <a href={`mailto:${profile.email}`} className="btn btn--glass">
                  <Icon name="mail" size={16} />
                  联系我
                </a>
              )}
            </div>
          </Glass>
        </div>
      </div>
    </div>
  )
}
