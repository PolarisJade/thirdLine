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
  { year: '现在', title: '独立开发者', desc: '维护 thirdLine 这个站点，把学到的东西沉淀成文字。' },
  { year: '2025', title: '后端开发', desc: '负责业务系统后端设计，习惯了把接口先定义清楚再写实现。' },
  { year: '2024', title: '开始写博客', desc: '发现写下来才是真的学会了，于是有了第一条线。' },
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
        <p className="page__desc">一个把想法写成代码，再把代码写成文字的人</p>
      </div>

      <div className="about-grid">
        {/* ---------------------------------------------------------- 名片 */}
        <Glass className="about-card" variant="strong">
          <Avatar size="xl" src={withFallback(profile?.avatar, avatarPlaceholder(profile?.nickname))} name={profile?.nickname} />
          <span className="about-card__name">{loading ? '加载中…' : profile?.nickname || 'PolarisJade'}</span>
          <span className="about-card__role">后端开发 / 独立开发者</span>

          <p className="text-muted text-sm" style={{ lineHeight: 1.85, marginTop: 4 }}>
            相信好的代码像好的文字，
            <br />
            读起来顺畅、有节奏，也留有余地。
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
                我是 <strong>{profile?.nickname || 'PolarisJade'}</strong>，一名后端开发。
                日常工作是把模糊的需求翻译成清晰的接口和表结构，然后在深夜里和边界条件较劲。
              </p>
              <p>
                这个站点叫 <strong>thirdLine（第三条线）</strong>，名字来自我对生活的理解：
                第一条线是必须做的事，第二条线是想做的事，
                而第三条线，是那些「没什么用但让我觉得活着真好」的事。
                写博客、拍照片、做点小工具，都属于第三条线。
              </p>
              <p>
                这里主要记录技术笔记、踩坑记录，以及一些做过的作品。
                如果某篇文章刚好帮你省下了半小时，那这个站点就值回票价了。
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
              <span className="stat-card__label">篇文章</span>
            </Glass>
            <Glass className="stat-card" hoverable>
              <span className="stat-card__icon">
                <Icon name="folder" size={19} />
              </span>
              <span className="stat-card__value">{formatNumber(stats?.categoryCount ?? 0)}</span>
              <span className="stat-card__label">个分类</span>
            </Glass>
            <Glass className="stat-card" hoverable>
              <span className="stat-card__icon">
                <Icon name="tag" size={19} />
              </span>
              <span className="stat-card__value">{formatNumber(stats?.tagCount ?? 0)}</span>
              <span className="stat-card__label">个标签</span>
            </Glass>
            <Glass className="stat-card" hoverable>
              <span className="stat-card__icon">
                <Icon name="image" size={19} />
              </span>
              <span className="stat-card__value">{formatNumber(stats?.photoCount ?? 0)}</span>
              <span className="stat-card__label">张照片</span>
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

          {/* 配图 + 邀请 */}
          <Glass variant="strong" radius="xl" style={{ overflow: 'hidden' }}>
            <img src={ABOUT_IMAGE} alt="" aria-hidden="true" style={{ width: '100%', height: 220, objectFit: 'cover' }} />
            <div className="stack" style={{ gap: 'var(--space-3)', padding: 'var(--space-5)' }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>欢迎随便逛逛</span>
              <span className="text-muted text-sm">
                文章里有我踩过的坑，作品集里有做过的东西，相册里有一些没头没尾的日常。
              </span>
              <div className="row wrap" style={{ gap: 12, marginTop: 4 }}>
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
            </div>
          </Glass>
        </div>
      </div>
    </div>
  )
}
