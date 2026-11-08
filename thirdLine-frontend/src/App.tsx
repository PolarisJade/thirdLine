import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness, CalendarDays, Camera, ChevronDown, CircleUserRound, Clock3, Code2, ExternalLink, FolderOpen, Github, Hash, Heart, Home, Image, Link2, ListFilter, LogIn, Mail, Menu, MessageCircle, Moon, Search, Send, Sparkles, Tag as TagIcon, UserPlus, X } from 'lucide-react'
import { api, ArchiveDay, Article, Category, FriendLink, LoginVO, Photo, Portfolio, Profile, SiteHistory, Stats, Tag, UserInfo } from './api'
import HeroClock from './components/HeroClock'

const fallbackProfile: Profile = { nickname: 'PolarisJade', github: 'https://github.com/PolarisJade', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=85', startTime: '2026-10-01' }
const fallbackStats: Stats = { articleCount: 8, categoryCount: 4, tagCount: 18, photoCount: 24, userCount: 1 }
const fallbackCategories: Category[] = [{ id: 1, name: '技术随笔' }, { id: 2, name: '读书随笔' }, { id: 3, name: '项目记录' }, { id: 4, name: '生活切片' }]
const fallbackArticles: Article[] = [
  { id: 1, title: '写给所有困在遗憾里无法释怀的人', summary: '所有书本与诗句教会我们，遗憾是人生常态，不必永远困在过往里。', categoryName: '情感随笔', publishedTime: '2026-08-18', coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=85', tags: [{ id: 1, name: '遗憾' }, { id: 2, name: '思考' }] },
  { id: 2, title: '《客厅》与《人间失格》：纯粹哭泣注定承受孤独', summary: '一心追逐纯粹的人，往往最难适应浑浊人间。极致的向往，也伴随着漫长的孤单。', categoryName: '读书随笔', publishedTime: '2026-08-12', coverImage: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=85', tags: [{ id: 3, name: '阅读' }, { id: 4, name: '孤独' }] },
  { id: 3, title: '污染了的忧伤之中，无人知晓的伤心记录', summary: '中原中也总是这样，藏着难以消光的忧愁，为每一个独自苦闷情绪的人深夜。', categoryName: '情感随笔', publishedTime: '2026-08-04', coverImage: 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?auto=format&fit=crop&w=900&q=85', tags: [{ id: 5, name: '诗歌' }] },
  { id: 4, title: '在天愿作比翼鸟，奈何世事总无常', summary: '人都向往连理枝一般长久相守，可太多错深，终究抵不过命运安排。', categoryName: '生活切片', publishedTime: '2026-07-30', coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85', tags: [{ id: 6, name: '生活' }, { id: 7, name: '感悟' }] },
]
type NavKey = 'home' | 'articles' | 'archive' | 'notes' | 'projects' | 'gallery' | 'links' | 'about'
const navItems: { key: NavKey; label: string; icon: typeof Home }[] = [
  { key: 'home', label: '首页', icon: Home }, { key: 'articles', label: '文章', icon: BookOpen }, { key: 'archive', label: '归档', icon: FolderOpen }, { key: 'notes', label: '说说', icon: MessageCircle }, { key: 'projects', label: '项目', icon: Sparkles }, { key: 'gallery', label: '相册', icon: Camera }, { key: 'links', label: '友链', icon: Link2 }, { key: 'about', label: '关于', icon: CircleUserRound },
]
function formatDate(date?: string) { return date ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date)) : '2026年8月18日' }
function formatArchiveDate(date?: string) { return date ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(date)) : '未定日期' }
function readingTime(article?: Article) { return String(Math.max(2, Math.ceil((article?.content?.length || article?.summary?.length || 420) / 260))) + ' 分钟阅读' }
function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char) }
function contentToHtml(content?: string) {
  if (!content?.trim()) return '<p>这篇文章还没有正文，先把它留在这里，等下一次整理时再继续书写。</p>'
  if (/<[a-z][\s\S]*>/i.test(content)) return content
  return content.trim().split(/\n{2,}/).map((paragraph) => '<p>' + escapeHtml(paragraph).replace(/\n/g, '<br />') + '</p>').join('')
}

export default function App() {
  const [active, setActive] = useState<NavKey>('home')
  const [profile, setProfile] = useState(fallbackProfile)
  const [stats, setStats] = useState(fallbackStats)
  const [categories, setCategories] = useState(fallbackCategories)
  const [tags, setTags] = useState<Tag[]>([])
  const [articles, setArticles] = useState(fallbackArticles)
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [selectedTag, setSelectedTag] = useState<number | undefined>()
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState('')
  const articleRequestId = useRef(0)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<number | undefined>()
  const [detail, setDetail] = useState<Article | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [archive, setArchive] = useState<ArchiveDay[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [friendLinks, setFriendLinks] = useState<FriendLink[]>([])
  const [friendApplyEnabled, setFriendApplyEnabled] = useState(true)
  const [siteHistory, setSiteHistory] = useState<SiteHistory[]>([])
  const [featureLoading, setFeatureLoading] = useState(true)

  useEffect(() => {
    if (!api.getToken()) return
    api.info().then(setCurrentUser).catch(() => { api.clearToken(); setCurrentUser(null) })
  }, [])

  useEffect(() => {
    let mounted = true
    const initialRequestId = articleRequestId.current
    Promise.allSettled([api.profile(), api.stats(), api.categories(), api.tags(), api.articles({ size: 8 }), api.archive(), api.portfolios(), api.photos(), api.friendLinks(), api.friendLinkApplyEnabled(), api.siteHistory()]).then(([p, s, c, t, a, ar, po, ph, fl, fa, sh]) => {
      if (!mounted) return
      if (p.status === 'fulfilled' && p.value) setProfile({ ...fallbackProfile, ...p.value })
      if (s.status === 'fulfilled' && s.value) setStats({ ...fallbackStats, ...s.value })
      if (c.status === 'fulfilled' && c.value?.length) setCategories(c.value)
      if (t.status === 'fulfilled' && t.value) setTags(t.value)
      if (articleRequestId.current === initialRequestId && a.status === 'fulfilled' && a.value?.records) { setArticles(a.value.records); setHasMore(Boolean(a.value.hasMore)); setNextCursor(a.value.nextCursor ?? undefined) }
      if (ar.status === 'fulfilled' && ar.value) setArchive(ar.value)
      if (po.status === 'fulfilled' && po.value) setPortfolios(po.value)
      if (ph.status === 'fulfilled' && ph.value) setPhotos(ph.value)
      if (fl.status === 'fulfilled' && fl.value) setFriendLinks(fl.value)
      if (fa.status === 'fulfilled' && typeof fa.value === 'boolean') setFriendApplyEnabled(fa.value)
      if (sh.status === 'fulfilled' && sh.value) setSiteHistory(sh.value)
      setFeatureLoading(false)
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  async function loadArticles(params: { categoryId?: number; tagId?: number; keyword?: string; cursor?: number } = {}, append = false) {
    const requestId = ++articleRequestId.current
    setListLoading(true)
    setListError('')
    try {
      const result = await api.articles({ ...params, size: 8 })
      if (requestId !== articleRequestId.current) return
      const records = result.records ?? []
      setArticles((current) => append ? [...current, ...records] : records)
      setHasMore(Boolean(result.hasMore))
      setNextCursor(result.nextCursor ?? undefined)
    } catch {
      if (requestId !== articleRequestId.current) return
      setListError('文章加载失败，暂时保留上次结果，请重新筛选。')
    } finally {
      if (requestId === articleRequestId.current) setListLoading(false)
    }
  }
  async function openArticle(id: number) {
    setActive('articles'); setDetailLoading(true); setDetail(null); setMobileOpen(false)
    try { setDetail(await api.article(id)) } catch { setDetail(articles.find((article) => article.id === id) ?? fallbackArticles.find((article) => article.id === id) ?? null) }
    finally { setDetailLoading(false) }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function openArticles(params: { categoryId?: number; tagId?: number; keyword?: string } = {}) {
    const enteringList = active !== 'articles' || detail !== null
    setActive('articles'); setDetail(null); setSelectedCategory(params.categoryId); setSelectedTag(params.tagId); setListSearch(params.keyword ?? ''); setSearch(params.keyword ?? ''); setSearchOpen(false); setMobileOpen(false)
    void loadArticles(params)
    if (enteringList) window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function navigate(key: NavKey) {
    setMobileOpen(false)
    if (key === 'articles') { openArticles(); return }
    if (key === 'archive') { setActive('archive'); setDetail(null); setSearchOpen(false); if (!archive.length) void loadArchive(); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    setActive(key)
    document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' })
  }
  async function loadArchive() {
    setArchiveLoading(true)
    try { setArchive(await api.archive()) } catch { setArchive([]) } finally { setArchiveLoading(false) }
  }
  const visibleArticles = useMemo(() => articles.filter((article) => !search || (article.title + ' ' + (article.summary ?? '')).toLowerCase().includes(search.toLowerCase())), [articles, search])
  const featured = visibleArticles[0]
  const displayArticles = visibleArticles.slice(1)
  const selectedCategoryName = categories.find((category) => category.id === selectedCategory)?.name
  const selectedTagName = tags.find((tag) => tag.id === selectedTag)?.name
  function submitSearch(event?: { preventDefault(): void }) {
    event?.preventDefault()
    const keyword = search.trim()
    if (active === 'articles') { setListSearch(keyword); void loadArticles({ categoryId: selectedCategory, tagId: selectedTag, keyword }); setSearchOpen(false) } else openArticles({ keyword })
  }
  function handleLoginSuccess(result: LoginVO) {
    api.setToken(result.token)
    setCurrentUser(result.userInfo ?? null)
    setLoginOpen(false)
  }
  function logout() {
    api.clearToken()
    setCurrentUser(null)
  }

  return <div className="site-shell">
    <div className="grain" />
    <header className="topbar">
      <button className="brand" onClick={() => navigate('home')} aria-label="返回首页"><span className="brand-mark"><Moon size={16} strokeWidth={1.8} /></span><strong>thirdLine</strong></button>
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="打开菜单">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
      <nav className={'nav ' + (mobileOpen ? 'is-open' : '')}>
        {navItems.map(({ key, label, icon: Icon }) => <button key={key} className={'nav-link ' + (active === key ? 'active' : '')} onClick={() => navigate(key)}><Icon size={15} />{label}</button>)}
        <button className={'login-button ' + (currentUser ? 'is-authenticated avatar-button' : '')} onClick={() => currentUser ? logout() : setLoginOpen(true)} aria-label={currentUser ? '退出登录' : '登录'} title={currentUser ? '退出登录' : '登录'}>{currentUser ? <><span className="user-avatar">{currentUser.avatar ? <img src={currentUser.avatar} alt="用户头像" /> : <CircleUserRound size={17} />}</span><span className="user-name">{currentUser.nickname || currentUser.username || '用户'}</span></> : <><LogIn size={15} /><span>登录</span></>}</button>
      </nav>
    </header>
    {searchOpen && <form className="search-drawer" onSubmit={submitSearch}><Search size={18} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索文章标题或摘要..." /><button type="button" onClick={() => { setSearch(''); setSearchOpen(false) }}><X size={16} /></button></form>}

    {active === 'home' ? <HomePage profile={profile} stats={stats} tags={tags} loading={loading} featured={featured} displayArticles={displayArticles} onArchive={() => navigate('archive')} onArticle={openArticle} onSearchTag={(id) => openArticles({ tagId: id })} /> : active === 'articles' && detail ? <ArticleDetail article={detail} loading={detailLoading} onBack={() => { setDetail(null); openArticles({ categoryId: selectedCategory, tagId: selectedTag, keyword: listSearch }) }} onCategory={(id) => openArticles({ categoryId: id })} /> : active === 'articles' ? <ArticleList articles={articles} loading={listLoading} error={listError} hasMore={hasMore} selectedCategory={selectedCategory} selectedCategoryName={selectedCategoryName} selectedTagName={selectedTagName} listSearch={listSearch} categories={categories} tags={tags} onCategory={(id) => openArticles({ categoryId: id })} onTag={(id) => openArticles({ tagId: id })} onSearch={(keyword) => openArticles({ categoryId: selectedCategory, tagId: selectedTag, keyword })} onArticle={openArticle} onMore={() => loadArticles({ categoryId: selectedCategory, tagId: selectedTag, keyword: listSearch, cursor: nextCursor }, true)} onClear={() => openArticles()} /> : active === 'archive' ? <ArchivePage archive={archive} loading={archiveLoading} onArticle={openArticle} /> : active === 'projects' ? <ProjectsPage portfolios={portfolios} loading={featureLoading} /> : active === 'gallery' ? <GalleryPage photos={photos} loading={featureLoading} /> : active === 'links' ? <FriendLinksPage links={friendLinks} enabled={friendApplyEnabled} loading={featureLoading} /> : active === 'about' ? <AboutPage profile={profile} stats={stats} history={siteHistory} loading={featureLoading} /> : <PlaceholderPage title={navItems.find((item) => item.key === active)?.label || '页面'} onHome={() => navigate('home')} />}

    <footer><span>© 2026 {profile.nickname || 'ThirdLine'}</span><span>Built with quiet curiosity <Moon size={13} /></span></footer>
    <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={handleLoginSuccess} />
  </div>
}

function LoginDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: (result: LoginVO) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [codeSending, setCodeSending] = useState(false)
  const [codeCountdown, setCodeCountdown] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const dialogRef = useRef<HTMLElement>(null)
  const [dialogHeight, setDialogHeight] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setMode('login'); setUsername(''); setPassword(''); setEmail(''); setCode(''); setNickname(''); setError(''); setSubmitting(false); setCodeCountdown(0)
    setDialogHeight(null)
  }, [open])

  useEffect(() => {
    if (!open || !dialogRef.current) return
    const frame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current
      if (!dialog) return

      // scrollHeight is clamped by the current explicit height when the
      // content is shorter, so briefly measure the natural auto height.
      const previousHeight = dialog.style.height
      dialog.style.height = 'auto'
      const naturalHeight = dialog.getBoundingClientRect().height
      dialog.style.height = previousHeight
      setDialogHeight(Math.ceil(naturalHeight))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open, mode, error])

  useEffect(() => {
    if (!codeCountdown) return
    const timer = window.setInterval(() => setCodeCountdown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [codeCountdown])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mode === 'login' && (!username.trim() || !password)) { setError('请输入用户名和密码'); return }
    if (mode === 'register' && (!email.trim() || !code.trim() || !username.trim() || !password)) { setError('请完整填写邮箱、验证码、用户名和密码'); return }
    setSubmitting(true); setError('')
    try {
      const result = mode === 'login'
        ? await api.login({ username: username.trim(), password })
        : await api.register({ email: email.trim(), code: code.trim(), username: username.trim(), password, nickname: nickname.trim() || undefined })
      onSuccess(result)
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : mode === 'login' ? '登录失败，请稍后重试' : '注册失败，请稍后重试') }
    finally { setSubmitting(false) }
  }

  async function sendCode() {
    const address = email.trim()
    if (!address) { setError('请先输入注册邮箱'); return }
    setCodeSending(true); setError('')
    try { await api.sendEmailCode(address); setCodeCountdown(60) }
    catch (reason) { setError(reason instanceof Error ? reason.message : '验证码发送失败，请稍后重试') }
    finally { setCodeSending(false) }
  }

  return <div className="login-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section ref={dialogRef} className="login-dialog" style={dialogHeight ? { height: `${dialogHeight}px` } : undefined} role="dialog" aria-modal="true" aria-labelledby="login-title">
      <button className="login-close" type="button" onClick={onClose} aria-label="关闭登录窗口"><X size={18} /></button>
      <div className="login-heading"><span className="login-mark">{mode === 'login' ? <Moon size={17} /> : <UserPlus size={17} />}</span><div><span className="section-kicker">{mode === 'login' ? 'WELCOME BACK' : 'JOIN THIRDLINE'}</span><h2 id="login-title">{mode === 'login' ? '登录 thirdLine' : '注册 thirdLine'}</h2></div></div>
      <p className="login-intro">{mode === 'login' ? '用你的账号继续阅读和记录。' : '创建账号，留下属于你的阅读轨迹。'}</p>
      <form onSubmit={submit} className="login-form">
        {mode === 'register' && <>
          <label>邮箱<input autoFocus type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="输入邮箱地址" /></label>
          <label>邮箱验证码<div className="code-field"><input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" placeholder="输入验证码" /><button type="button" onClick={sendCode} disabled={codeSending || codeCountdown > 0}>{codeSending ? '发送中…' : codeCountdown ? `${codeCountdown}s 后重发` : '获取验证码'}</button></div></label>
        </>}
        <label>{mode === 'login' ? '用户名或邮箱' : '用户名'}<input autoFocus={mode === 'login'} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder={mode === 'login' ? '输入用户名或注册邮箱' : '3-20 个字符'} /></label>
        {mode === 'register' && <label>昵称（可选）<input value={nickname} onChange={(event) => setNickname(event.target.value)} autoComplete="nickname" placeholder="展示在个人资料中的名称" /></label>}
        <label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="输入密码" /></label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-submit" type="submit" disabled={submitting}>{submitting ? (mode === 'login' ? '正在登录…' : '正在注册…') : mode === 'login' ? '登录' : '注册并登录'}<ArrowRight size={16} /></button>
      </form>
      <button className="auth-switch" type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? '还没有账号？立即注册' : '已有账号？返回登录'}</button>
    </section>
  </div>
}

function HomePage({ profile, stats, tags, loading, featured, displayArticles, onArchive, onArticle, onSearchTag }: { profile: Profile; stats: Stats; tags: Tag[]; loading: boolean; featured?: Article; displayArticles: Article[]; onArchive: () => void; onArticle: (id: number) => void; onSearchTag: (id: number) => void }) {
  const profileEmail = profile.email?.trim()
  return <main className="home-page">
    <section className="hero" aria-label="日期与时钟">
      <div className="hero-backdrop" />
      <div className="hero-overlay" />
      <div className="hero-inner"><HeroClock /></div>
    </section>
    <div className="home-content">
    <section className="content-grid" id="content">
      <aside className="profile-column">
        <div className="profile-card">
          <div className="avatar-wrap"><img src={profile.avatar || fallbackProfile.avatar} alt="站主头像" /><span className="avatar-badge"><Moon size={14} /></span></div>
          <span className="profile-role">BLOGGER</span>
          <h2>{profile.nickname || 'ThirdLine'}</h2>
          <p>独立开发者与持续学习者</p>
          <div className="profile-rule" />
          <div className="profile-contacts">
            <a className="profile-link profile-contact" href={profile.github || '#'} target="_blank" rel="noreferrer"><Github size={15} /> GitHub <ExternalLink size={12} /></a>
            {profileEmail && <a className="profile-link profile-contact" href={'mailto:' + profileEmail} title={profileEmail} aria-label={'发送邮件至 ' + profileEmail}><Mail size={15} /> 邮箱</a>}
          </div>
          <a className="profile-link subtle" href={profile.github || '#'} target="_blank" rel="noreferrer">个人档案</a>
        </div>
        <div className="tiny-manifesto"><Moon size={19} /><strong>在月光下持续写作</strong><span>Keep writing, keep wondering.</span></div>
      </aside>
      <section className="journal-column">{loading && <div className="loading-bar" />}{featured && <article className="featured-card" onClick={() => onArticle(featured.id)}><img src={featured.coverImage || fallbackArticles[0].coverImage} alt="" /><div className="featured-shade" /><div className="featured-content"><span className="article-pill"><Sparkles size={13} /> 编辑精选</span><h2>{featured.title}</h2><p>{featured.summary}</p><div className="article-meta"><CalendarDays size={13} /> {formatDate(featured.publishedTime)} <span><Clock3 size={12} /> {readingTime(featured)}</span></div></div></article>}<div className="section-heading"><div><span className="section-kicker">LATEST STORIES</span><h2>最近书写</h2></div><button onClick={onArchive}>文章归档 <ArrowRight size={15} /></button></div><div className="article-list">{displayArticles.map((article) => <ArticleRow key={article.id} article={article} onClick={() => onArticle(article.id)} />)}</div>{!displayArticles.length && <div className="empty-state">暂时没有更多文章</div>}<button className="more-button" onClick={onArchive}>按时间查看全部 <ArrowRight size={16} /></button></section>
      <aside className="stats-column"><div className="side-panel"><h3>站点统计</h3><Stat icon={<BookOpen size={16} />} label="文章" value={stats.articleCount ?? 0} /><Stat icon={<FolderOpen size={16} />} label="分类" value={stats.categoryCount ?? 0} /><Stat icon={<TagIcon size={16} />} label="标签" value={stats.tagCount ?? 0} /><Stat icon={<MessageCircle size={16} />} label="说说" value="11" /></div><div className="side-panel themes"><h3>标签展示</h3>{tags.length ? <div className="tag-cloud">{tags.map((tag, index) => <button key={tag.id} className={'tag-tone-' + (index % 3)} type="button" onClick={() => onSearchTag(tag.id)}>#{tag.name}</button>)}</div> : <div className="tag-empty">暂无标签</div>}</div></aside>
    </section>
    </div>
  </main>
}
function ArticleRow({ article, onClick }: { article: Article; onClick: () => void }) { return <article className="article-row" onClick={onClick} tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onClick()}><img src={article.coverImage || fallbackArticles[0].coverImage} alt="" /><div className="article-row-body"><div className="row-top"><span className="category-label">{article.categoryName || '随笔'}</span><span className="row-date"><CalendarDays size={12} />{formatDate(article.publishedTime)}　<Clock3 size={12} />{readingTime(article)}</span></div><h3>{article.title}</h3><p>{article.summary || '关于一些技术、生活与正在发生的思考。'}</p><div className="tag-line">{(article.tags || []).map((tag) => <span key={tag.id}>#{tag.name}</span>)}</div></div><span className="row-arrow"><ArrowRight size={17} /></span></article> }

function ArticleList({ articles, loading, error, hasMore, selectedCategory, selectedCategoryName, selectedTagName, listSearch, categories, tags, onCategory, onTag, onSearch, onArticle, onMore, onClear }: { articles: Article[]; loading: boolean; error: string; hasMore: boolean; selectedCategory?: number; selectedCategoryName?: string; selectedTagName?: string; listSearch: string; categories: Category[]; tags: Tag[]; onCategory: (id?: number) => void; onTag: (id?: number) => void; onSearch: (keyword: string) => void; onArticle: (id: number) => void; onMore: () => void; onClear: () => void }) {
  const [keyword, setKeyword] = useState(listSearch)
  useEffect(() => setKeyword(listSearch), [listSearch])

  return <main className="inner-page article-list-page">
    <div className="category-filter">
      <FilterGroup title="分类">
        <div className="category-options">
          <button className={!selectedCategory ? 'filter-option active' : 'filter-option'} onClick={() => onCategory(undefined)}>全部文章 <span>↗</span></button>
          {categories.map((category) => <button key={category.id} className={selectedCategory === category.id ? 'filter-option active' : 'filter-option'} onClick={() => onCategory(category.id)}>{category.name}<span>↗</span></button>)}
        </div>
      </FilterGroup>
      <FilterGroup title="标签">
        <div className="category-options tag-options">
          {tags.map((tag) => <button key={tag.id} className={selectedTagName === tag.name ? 'filter-option active' : 'filter-option'} onClick={() => onTag(tag.id)}>#{tag.name}</button>)}
        </div>
      </FilterGroup>
    </div>
    <div className="article-layout">
      <section className="article-browser">
        <form className="article-search" onSubmit={(event) => { event.preventDefault(); onSearch(keyword.trim()) }}>
          <Search size={16} />
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索标题或摘要" />
          <button type="submit">搜索</button>
        </form>
        <div className="filter-line">
          <div className="filter-label">
            <ListFilter size={15} /> 筛选
            {selectedCategoryName && <span> / {selectedCategoryName}</span>}
            {selectedTagName && <span> / #{selectedTagName}</span>}
            {listSearch && <span> / “{listSearch}”</span>}
          </div>
          <div className="filter-actions">
            <span className="filter-status" role="status">{loading ? '正在更新文章…' : ''}</span>
            <button onClick={onClear}>清除条件</button>
          </div>
        </div>
        {error && <p className="article-load-error" role="alert">{error}</p>}
        <div className="article-results" aria-busy={loading}>
          <div className="article-list wide-list">
            {articles.map((article) => <ArticleRow key={article.id} article={article} onClick={() => onArticle(article.id)} />)}
          </div>
          {!articles.length && <div className="empty-state large-empty">
            <BookOpen size={25} />
            <strong>还没有找到文章</strong>
            <span>换一个关键词，或浏览全部文章。</span>
          </div>}
          {hasMore && <button className="load-more" onClick={onMore} disabled={loading}>加载更多 <ChevronDown size={16} /></button>}
        </div>
      </section>
    </div>
  </main>
}
function FilterGroup({ title, children }: { title: string; children: ReactNode }) { return <div className="filter-group"><h3>{title}</h3>{children}</div> }
function ArticleDetail({ article, loading, onBack, onCategory }: { article: Article; loading: boolean; onBack: () => void; onCategory: (id?: number) => void }) { return <main className="inner-page detail-page">{loading && <div className="detail-loading"><div className="loading-bar" /></div>}<button className="back-link" onClick={onBack}><ArrowLeft size={15} /> 返回文章列表</button><div className="detail-header"><div><div className="detail-kicker"><span>{article.categoryName || '随笔'}</span><span>·</span><span>{formatDate(article.publishedTime)}</span></div><h1>{article.title}</h1><p className="detail-summary">{article.summary}</p><div className="detail-meta"><span><Clock3 size={14} /> {readingTime(article)}</span><span><CircleUserRound size={14} /> {article.authorName || 'PolarisJade'}</span><span><Hash size={14} /> {article.isOriginal === 0 ? '转载' : '原创'}</span></div></div>{article.coverImage && <img className="detail-cover" src={article.coverImage} alt="" />}</div><div className="detail-body-grid"><article className="article-content" dangerouslySetInnerHTML={{ __html: contentToHtml(article.content) }} /><aside className="detail-aside"><div className="detail-aside-line" /><span className="section-kicker">ON THIS PAGE</span><strong>{article.categoryName || '随笔'}</strong><button onClick={() => onCategory(article.categoryId)}>浏览同类文章 <ArrowRight size={15} /></button>{article.tags?.length ? <div className="detail-tags">{article.tags.map((tag) => <span key={tag.id}>#{tag.name}</span>)}</div> : null}</aside></div></main> }
function ArchivePage({ archive, loading, onArticle }: { archive: ArchiveDay[]; loading: boolean; onArticle: (id: number) => void }) { const yearGroups = archive.reduce<Record<string, ArchiveDay[]>>((groups, day) => { const year = day.date?.slice(0, 4) || '未定'; (groups[year] ||= []).push(day); return groups }, {}); return <main className="inner-page archive-page"><div className="page-intro archive-intro"><div><span className="section-kicker">THE ARCHIVE / 时间线</span><h1>每一次写下，<br /><em>都是给未来的信。</em></h1><p>按发布时间回看这里留下的文字。</p></div><div className="archive-count">{archive.reduce((count, day) => count + (day.articles?.length || 0), 0)}<span>篇文章</span></div></div>{loading && <div className="skeleton-list"><span /><span /><span /></div>}{!loading && !archive.length && <div className="empty-state large-empty">还没有可归档的文章</div>}{!loading && Object.entries(yearGroups).map(([year, days]) => <section className="archive-year" key={year}><div className="archive-year-label"><strong>{year}</strong><span>YEAR</span></div><div className="archive-days">{days.map((day) => <div className="archive-day" key={day.date}><div className="archive-date"><CalendarDays size={15} />{formatArchiveDate(day.date)}</div>{day.articles?.map((article) => <button className="archive-entry" key={article.id} onClick={() => onArticle(article.id)}><span>{article.title}</span><small>{article.categoryName || '随笔'} <ArrowRight size={14} /></small></button>)}</div>)}</div></section>)}</main> }
function ProjectsPage({ portfolios, loading }: { portfolios: Portfolio[]; loading: boolean }) {
  return <main className="inner-page feature-page projects-page"><div className="page-intro"><div><span className="section-kicker">SELECTED WORK / 项目</span><h1>把想法做成，<br /><em>可以抵达的东西。</em></h1><p>一些正在生长的产品、实验与长期练习。</p></div><div className="page-index">{String(portfolios.length).padStart(2, '0')}<span>PROJECTS</span></div></div>{loading ? <FeatureSkeleton /> : !portfolios.length ? <FeatureEmpty icon={<BriefcaseBusiness size={26} />} title="项目还在整理中" text="等第一件作品发布后，它会出现在这里。" /> : <div className="project-list">{portfolios.map((project, index) => <article className="project-item" key={project.id}><div className="project-index">{String(index + 1).padStart(2, '0')}</div><div className="project-visual">{project.coverImage ? <img src={project.coverImage} alt="" /> : <div className="project-visual-fallback"><Code2 size={38} /><span>THIRDLINE / LAB</span></div>}</div><div className="project-copy"><div className="project-meta"><span>{project.period || formatDate(project.publishTime)}</span><span>{project.role || '独立制作'}</span></div><h2>{project.title}</h2><p>{project.summary || '一个持续迭代中的小作品。'}</p>{project.techStacks?.length ? <div className="tech-list">{project.techStacks.map((tech) => <span key={tech.id}>{tech.name}</span>)}</div> : null}<div className="project-links">{project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noreferrer">查看演示 <ExternalLink size={14} /></a>}{project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer"><Github size={14} /> 源码</a>}</div></div></article>)}</div>}</main>
}
function GalleryPage({ photos, loading }: { photos: Photo[]; loading: boolean }) { const [selected, setSelected] = useState<Photo | null>(null); return <main className="inner-page feature-page gallery-page"><div className="page-intro"><div><span className="section-kicker">FIELD NOTES / 相册</span><h1>把路过的光，<br /><em>保存成一张张照片。</em></h1><p>城市、远方，以及一些不想忘记的下午。</p></div><div className="page-index">{String(photos.length).padStart(2, '0')}<span>PHOTOGRAPHS</span></div></div>{loading ? <FeatureSkeleton /> : !photos.length ? <FeatureEmpty icon={<Image size={26} />} title="相册还没有照片" text="下一次出门时，记得带上相机。" /> : <div className="photo-masonry">{photos.map((photo, index) => <button className={'photo-tile photo-tile-' + (index % 5)} key={photo.id} onClick={() => setSelected(photo)}><img src={photo.url} alt={photo.title || '相册照片'} /><span className="photo-caption"><strong>{photo.title || '未命名照片'}</strong><small>{photo.description || photo.cityCode || 'thirdLine'}</small></span></button>)}</div>}{selected && <div className="photo-lightbox" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><button className="lightbox-close" onClick={() => setSelected(null)} aria-label="关闭照片"><X size={20} /></button><img src={selected.url} alt={selected.title || '相册照片'} /><div><strong>{selected.title || '未命名照片'}</strong><span>{selected.description || selected.cityCode || ''}</span></div></div>}</main> }
function FriendLinksPage({ links, enabled, loading }: { links: FriendLink[]; enabled: boolean; loading: boolean }) { const [applyOpen, setApplyOpen] = useState(false); return <main className="inner-page feature-page links-page"><div className="page-intro"><div><span className="section-kicker">NEIGHBOURHOOD / 友链</span><h1>在别人的窗口，<br /><em>遇见另一种生活。</em></h1><p>这里收集一些认真写东西、做东西的人。</p></div><div className="page-index">{String(links.length).padStart(2, '0')}<span>FRIENDS</span></div></div>{loading ? <FeatureSkeleton /> : <><div className="link-grid">{links.map((link) => <a className="friend-card" href={link.url} target="_blank" rel="noreferrer" key={link.id}><span className="friend-avatar">{link.avatar ? <img src={link.avatar} alt="" /> : <Link2 size={19} />}</span><span className="friend-card-copy"><strong>{link.name}</strong><span>{link.description || link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span></span><ExternalLink size={15} /></a>)}{!links.length && <FeatureEmpty icon={<Heart size={26} />} title="还没有公开友链" text="等第一位朋友加入这里。" />}</div>{enabled && <button className="apply-link-button" onClick={() => setApplyOpen(true)}><Send size={15} /> 申请交换友链</button>}{!enabled && <p className="apply-disabled">友链申请暂时关闭，欢迎先逛逛。</p>}</>}{applyOpen && <FriendLinkApply onClose={() => setApplyOpen(false)} />}</main> }
function FriendLinkApply({ onClose }: { onClose: () => void }) { const [form, setForm] = useState({ name: '', url: '', avatar: '', description: '', email: '' }); const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle'); const [error, setError] = useState(''); function update(key: keyof typeof form, value: string) { setForm((current) => ({ ...current, [key]: value })) } async function submit(event: React.FormEvent) { event.preventDefault(); if (!form.name.trim() || !form.url.trim()) { setError('请填写站点名称和地址'); return } setStatus('sending'); setError(''); try { await api.friendLinkApply({ ...form, name: form.name.trim(), url: form.url.trim() }); setStatus('success') } catch (reason) { setStatus('error'); setError(reason instanceof Error ? reason.message : '提交失败，请稍后再试') } } return <div className="apply-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="apply-dialog" role="dialog" aria-modal="true"><button className="login-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>{status === 'success' ? <div className="apply-success"><Heart size={24} /><h2>申请已收到</h2><p>审核通过后，你的网站会出现在友链页。</p><button className="light-button primary-button" onClick={onClose}>知道了 <ArrowRight size={16} /></button></div> : <><div className="login-heading"><span className="login-mark"><Link2 size={17} /></span><div><span className="section-kicker">JOIN THE NEIGHBOURHOOD</span><h2>申请交换友链</h2></div></div><p className="login-intro">留下你的网站信息，我会尽快看见。</p><form className="login-form" onSubmit={submit}><label>站点名称<input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="例如：某某的博客" /></label><label>站点地址<input type="url" value={form.url} onChange={(event) => update('url', event.target.value)} placeholder="https://" /></label><label>头像地址（可选）<input value={form.avatar} onChange={(event) => update('avatar', event.target.value)} placeholder="https://" /></label><label>一句话介绍（可选）<input value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="你在记录什么？" /></label><label>联系邮箱（可选）<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="只用于审核联系" /></label>{error && <p className="login-error">{error}</p>}<button className="login-submit" disabled={status === 'sending'}>{status === 'sending' ? '正在提交…' : '提交申请'} <ArrowRight size={16} /></button></form></>}</section></div> }
function AboutPage({ profile, stats, history, loading }: { profile: Profile; stats: Stats; history: SiteHistory[]; loading: boolean }) { return <main className="inner-page feature-page about-page"><div className="page-intro"><div><span className="section-kicker">A LITTLE ABOUT / 关于</span><h1>我在这里，<br /><em>练习长期主义。</em></h1><p>写字、做产品，也记录那些让人重新相信日常的时刻。</p></div><div className="page-index">∞<span>KEEP GOING</span></div></div><div className="about-grid"><section className="about-profile"><div className="about-portrait"><img src={profile.avatar || fallbackProfile.avatar} alt="站主头像" /><span><Moon size={14} /> thirdLine</span></div><h2>{profile.nickname || 'ThirdLine'}</h2><p>独立开发者，喜欢把复杂的事讲清楚，把微小的念头做出来。</p><div className="about-links">{profile.github && <a href={profile.github} target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a>}{profile.email && <a href={'mailto:' + profile.email}><Mail size={15} /> {profile.email}</a>}</div></section><section className="about-copy"><p className="about-lead">thirdLine 是一个私人角落，也是一份公开的练习：在快速变化的世界里，保留慢一点的观察。</p><div className="about-stats"><div><strong>{stats.articleCount ?? 0}</strong><span>篇文章</span></div><div><strong>{stats.photoCount ?? 0}</strong><span>张照片</span></div><div><strong>{stats.userCount ?? 0}</strong><span>位读者</span></div></div><div className="history-block"><div className="history-heading"><span className="section-kicker">SITE HISTORY</span><h3>这个地方如何长大</h3></div>{loading ? <FeatureSkeleton /> : history.length ? <div className="history-list">{history.map((item) => <div className="history-item" key={item.id}><time>{item.updateDate || ''}</time><div><strong>{item.version || item.updateTypeLabel || '更新'}</strong><p>{item.description}</p></div></div>)}</div> : <p className="history-empty">还没有公开的更新记录。</p>}</div></section></div></main> }
function FeatureSkeleton() { return <div className="feature-skeleton"><span /><span /><span /></div> }
function FeatureEmpty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { return <div className="feature-empty"><span>{icon}</span><strong>{title}</strong><p>{text}</p></div> }
function PlaceholderPage({ title, onHome }: { title: string; onHome: () => void }) { return <main className="inner-page placeholder-page"><span className="section-kicker">COMING SOON</span><h1>{title}<br /><em>正在路上。</em></h1><p>这个空间还在慢慢整理，先回到首页看看最近的文字。</p><button className="primary-button light-button" onClick={onHome}>返回首页 <ArrowRight size={16} /></button></main> }
function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) { return <div className="stat-row"><span className="stat-label">{icon}{label}</span><strong>{value}</strong></div> }

