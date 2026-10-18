import { useState, type FormEvent } from 'react'
import { friendLinkApi, siteApi } from '@/api'
import { ApiError } from '@/api/client'
import { ResultCode, type FriendLinkApplyDTO, type FriendLinkVO } from '@/api/types'
import { useAsync, useSubmit } from '@/hooks/useAsync'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Field, Input, Textarea } from '@/components/Form'
import { EmptyState, FriendLinkSkeleton } from '@/components/Feedback'
import { LinkAvatar } from '@/components/LinkAvatar'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/ToastContext'
import { cx } from '@/utils/format'
import { avatarPlaceholder, withFallback } from '@/utils/placeholder'

/**
 * 友链页。
 *
 * 数据：GET /user/friend-link/list（只有审核通过且未被隐藏的友链）
 * 申请：POST /user/friend-link/apply（免登录，落库后进入待审核）
 *
 * 申请走一个三步的小卡片（弹窗），不把表单摊在页面上：
 *   1. 注意事项   2. 本站信息（可复制）   3. 填写申请
 * 弹窗、按钮、表单字段全部复用 components 里已有的 Modal / Button / Field，
 * 步进条只做展示，不带交互，因此没有引入新组件库。
 */

/** 站点的自我描述，与页脚那句保持一致，避免同一件事有两种说法 */
const SITE_SLOGAN = '代码、设计与生活的交界处'

/* 长度限制与后端 FriendLinkServiceImpl 的校验保持一致，避免前后端口径不一 */
const NAME_MAX = 64
const URL_MAX = 255
const AVATAR_MAX = 500
const DESC_MAX = 255
const EMAIL_MAX = 64

const URL_PATTERN = /^https?:\/\/\S+$/i
const EMAIL_PATTERN = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/

const EMPTY_FORM: FriendLinkApplyDTO = { name: '', url: '', avatar: '', description: '', email: '' }

/** 三步的标题，同时用于步进条 */
const STEPS = ['注意事项', '本站信息', '填写申请'] as const

/** 表单与「提交申请」按钮不在同一个 DOM 容器里，用 form 属性把两者关联起来 */
const APPLY_FORM_ID = 'friend-link-apply-form'

type FormField = 'name' | 'url' | 'avatar' | 'description' | 'email'
type FormErrors = Partial<Record<FormField, string>>

/** 从地址里取域名，用作卡片上那行小字；解析失败时退化成去掉协议头的原文 */
function siteHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
  }
}

function validate(form: FriendLinkApplyDTO): FormErrors {
  const errors: FormErrors = {}
  const name = form.name.trim()
  const url = form.url.trim()
  const avatar = (form.avatar ?? '').trim()
  const description = (form.description ?? '').trim()
  const email = (form.email ?? '').trim()

  if (!name) {
    errors.name = '请填写站点名称'
  } else if (name.length > NAME_MAX) {
    errors.name = `站点名称不能超过 ${NAME_MAX} 个字符`
  }

  if (!url) {
    errors.url = '请填写站点地址'
  } else if (!URL_PATTERN.test(url)) {
    errors.url = '地址需要以 http:// 或 https:// 开头'
  } else if (url.length > URL_MAX) {
    errors.url = `站点地址不能超过 ${URL_MAX} 个字符`
  }

  if (avatar.length > AVATAR_MAX) {
    errors.avatar = `图标地址不能超过 ${AVATAR_MAX} 个字符`
  }
  if (description.length > DESC_MAX) {
    errors.description = `站点描述不能超过 ${DESC_MAX} 个字符`
  }
  if (email && (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email))) {
    errors.email = '邮箱格式不正确'
  }

  return errors
}

/* ================================================================ 友链卡片 */

function FriendCard({ link }: { link: FriendLinkVO }) {
  const host = siteHost(link.url)

  return (
    <a
      className="glass glass--hoverable friend-card"
      href={link.url}
      target="_blank"
      rel="noreferrer noopener"
      title={`打开 ${link.name}`}
    >
      <LinkAvatar src={link.avatar} name={link.name} />
      <span className="friend-card__body">
        <span className="friend-card__name truncate-1">{link.name}</span>
        <span className="friend-card__desc truncate-2">{link.description?.trim() || '这个站点还没有写简介'}</span>
        <span className="friend-card__domain">{host}</span>
      </span>
      <Icon name="arrowRight" size={15} className="friend-card__arrow" />
    </a>
  )
}

/* ==================================================================== 页面 */

export function FriendLinksPage() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => friendLinkApi.list(), [])
  const { data: profile } = useAsync(() => siteApi.profile(), [])
  const { pending, run } = useSubmit()

  const [wizardOpen, setWizardOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FriendLinkApplyDTO>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  /** 哪些字段已经被碰过（失焦过）：只有碰过的字段才在输入过程中实时复校验 */
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({})

  const links = data ?? []
  const siteName = profile?.nickname?.trim() || 'thirdLine'
  const siteAvatar = withFallback(profile?.avatar, avatarPlaceholder(siteName))
  const siteUrl = window.location.origin

  /** 交换友链时对方要填的四项，顺序和常见友链页一致 */
  const siteInfo = [
    { label: '名称', value: siteName, mono: false },
    { label: '地址', value: siteUrl, mono: true },
    { label: '头像', value: siteAvatar, mono: true },
    { label: '描述', value: SITE_SLOGAN, mono: false },
  ]

  const openWizard = () => {
    setStep(1)
    setErrors({})
    setTouched({})
    setWizardOpen(true)
  }

  const closeWizard = () => {
    if (pending) return
    setWizardOpen(false)
  }

  /**
   * 切换步骤。
   * 顺手清空校验结果与「已碰过」标记：这样从别的步骤回到第 3 步时，
   * 卡片是干净的，不会一进来就顶着红字。
   *
   * 写成函数声明而不是 const 箭头函数：函数声明会被提升，
   * 这样即便页脚那段 JSX 在源码里出现在它前面，也不存在先用后定义的时序问题。
   */
  function goStep(next: number) {
    setStep(next)
    setErrors({})
    setTouched({})
  }

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label}已复制`)
    } catch {
      toast.warning('浏览器不允许自动复制，请手动选中后复制')
    }
  }

  const patch = (field: FormField) => (event: { target: { value: string } }) => {
    const next = { ...form, [field]: event.target.value }
    setForm(next)
    // 该字段已经报过错、或用户已经离开过它，就边输入边复校验，让红字及时消失
    if (errors[field] || touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validate(next)[field] }))
    }
  }

  /**
   * 失焦才校验单个字段。
   * 进入第 3 步时不主动校验，只有用户真正离开某个输入框后才在那里给提示。
   */
  const checkOnBlur = (field: FormField) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors((prev) => ({ ...prev, [field]: validate(form)[field] }))
  }

  /** 真正的提交动作：校验、提交、给出结果。表单回车和页脚按钮共用它 */
  const submit = async () => {
    const nextErrors = validate(form)
    setErrors(nextErrors)
    // 提交过一次之后所有字段都算「碰过」，后续边改边校验
    setTouched({ name: true, url: true, avatar: true, description: true, email: true })
    if (Object.keys(nextErrors).length > 0) {
      toast.warning(Object.values(nextErrors)[0] ?? '请检查表单')
      return
    }

    const payload: FriendLinkApplyDTO = {
      name: form.name.trim(),
      url: form.url.trim(),
      avatar: form.avatar?.trim() || undefined,
      description: form.description?.trim() || undefined,
      email: form.email?.trim() || undefined,
    }

    const result = await run(async () => {
      try {
        await friendLinkApi.apply(payload)
      } catch (submitError) {
        // 地址相关的错误能定位到具体输入框，其余交给 toast
        if (
          submitError instanceof ApiError &&
          (submitError.code === ResultCode.FRIEND_LINK_URL_DUPLICATE ||
            submitError.code === ResultCode.FRIEND_LINK_URL_INVALID)
        ) {
          setErrors((prev) => ({ ...prev, url: submitError.message }))
        }
        throw submitError
      }
    })

    if (result.ok) {
      toast.success('申请成功，通过后将会通过邮件告知')
      setForm(EMPTY_FORM)
      setErrors({})
      setWizardOpen(false)
      return
    }
    toast.error(result.error || '提交失败，请稍后再试')
  }

  /** 表单内的回车提交：交给 submit()，只负责拦掉默认的页面跳转 */
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit()
  }

  /* ------------------------------------------------------------ 弹窗三段内容 */

  const stepNotes = (
    <div className="stack" style={{ gap: 'var(--space-3)' }}>
      <p className="wizard-lead">先花半分钟看下这几条，能省掉来回沟通。</p>
      <ol className="notice__list">
        <li>站点能正常打开，内容以原创为主；长期闲置或长期打不开的会移除。</li>
        <li>请先在贵站加上本站友链再提交申请，这里是双向友链。</li>
        <li>站点需启用 HTTPS，不接受采集站、纯广告站与灰色内容。</li>
        <li>提交后由我人工审核，通过后会出现在上面的列表里。</li>
      </ol>
    </div>
  )

  const stepSiteInfo = (
    <div className="stack" style={{ gap: 'var(--space-4)' }}>
      <p className="wizard-lead">
        先把本站这四项加进你的友链页，再提交申请。每一项右侧都能单独复制。
      </p>

      <div className="site-card__head">
        <LinkAvatar src={siteAvatar} name={siteName} large />
        <div className="stack" style={{ gap: 2, minWidth: 0 }}>
          <span className="site-card__name">{siteName}</span>
          <span className="site-card__slogan">{SITE_SLOGAN}</span>
        </div>
      </div>

      <div className="site-card__list">
        {siteInfo.map((item) => (
          <div className="site-card__row" key={item.label}>
            <span className="site-card__label">{item.label}</span>
            <span className={cx('site-card__value', item.mono && 'site-card__value--mono')} title={item.value}>
              {item.value}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              icon="copy"
              aria-label={`复制${item.label}`}
              onClick={() => copy(item.value, item.label)}
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="glass"
        icon="copy"
        block
        onClick={() => copy(siteInfo.map((item) => `${item.label}：${item.value}`).join('\n'), '本站友链信息')}
      >
        复制全部信息
      </Button>
    </div>
  )

  const stepForm = (
    <form id={APPLY_FORM_ID} className="apply-form" onSubmit={onSubmit} noValidate>
      <div className="apply-form__pair">
        <Field label="站点名称" required error={errors.name}>
          <Input
            icon="sparkles"
            value={form.name}
            onChange={patch('name')}
            onBlur={checkOnBlur('name')}
            placeholder="例如：第三行"
            maxLength={NAME_MAX}
            autoComplete="off"
          />
        </Field>
        <Field label="站点地址" required error={errors.url}>
          <Input
            icon="link"
            value={form.url}
            onChange={patch('url')}
            onBlur={checkOnBlur('url')}
            placeholder="https://example.com"
            maxLength={URL_MAX}
            autoComplete="url"
            inputMode="url"
          />
        </Field>
      </div>

      <Field label="站点图标" error={errors.avatar} hint="选填，留空用站点名首字母">
        <Input
          icon="image"
          value={form.avatar}
          onChange={patch('avatar')}
          onBlur={checkOnBlur('avatar')}
          placeholder="https://example.com/logo.png"
          maxLength={AVATAR_MAX}
          autoComplete="off"
        />
      </Field>

      <Field label="站点描述" error={errors.description} hint="会显示在友链卡片里">
        <Textarea
          rows={3}
          value={form.description}
          onChange={patch('description')}
          onBlur={checkOnBlur('description')}
          placeholder="例如：写代码，也写生活"
          maxLength={DESC_MAX}
          showCount
        />
      </Field>

      <Field label="联系邮箱" error={errors.email} hint="选填，仅我可见">
        <Input
          icon="mail"
          type="email"
          value={form.email}
          onChange={patch('email')}
          onBlur={checkOnBlur('email')}
          placeholder="you@example.com"
          maxLength={EMAIL_MAX}
          autoComplete="email"
        />
      </Field>

      {/*
        让输入框里按回车也能提交：浏览器需要一个「默认提交按钮」才会做隐式提交。
        这个按钮只服务于回车，不展示、也点不到；可见的「提交申请」在弹窗页脚里，
        那里所有按钮都是 type="button"，避免上面注释提到的复用误提交。
      */}
      <button type="submit" hidden tabIndex={-1} aria-hidden="true" />
    </form>
  )

  /* ---------------------------------------------------------------- 弹窗页脚 */

  /**
   * 弹窗页脚。
   *
   * 页脚里所有按钮一律 type="button"，一个 submit 都不放（提交靠 onClick 调 submit()）。
   * 原因：两个页脚的 DOM 结构相同，React 会把第 2 步的「下一步」原地复用成第 3 步的
   * 「提交申请」，只改属性不改节点。浏览器是在事件监听器跑完、DOM 已更新之后，
   * 才执行这次点击的默认行为；如果那个节点此时变成了 submit 按钮，这次点击就成了
   * 对刚挂载表单的提交，一进第 3 步就触发校验、弹出「请填写站点名称」。
   * 让节点从头到尾都不是 submit，这条链就断了。回车提交由表单内那个隐藏的
   * submit 按钮负责，它不会被用户点到。
   */
  const wizardFooter =
    step === 1 ? (
      <>
        <Button type="button" variant="ghost" onClick={closeWizard}>
          取消
        </Button>
        <Button type="button" variant="primary" iconRight="arrowRight" onClick={() => goStep(2)}>
          下一步
        </Button>
      </>
    ) : step === 2 ? (
      <>
        <Button type="button" variant="ghost" onClick={() => goStep(1)}>
          上一步
        </Button>
        <Button type="button" variant="primary" iconRight="arrowRight" onClick={() => goStep(3)}>
          下一步
        </Button>
      </>
    ) : (
      <>
        <Button type="button" variant="ghost" onClick={() => goStep(2)} disabled={pending}>
          上一步
        </Button>
        <Button type="button" variant="primary" icon="send" loading={pending} onClick={submit}>
          提交申请
        </Button>
      </>
    )

  return (
    <div className="container">
      <div
        className="page__header row wrap"
        style={{ justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}
      >
        <div>
          <h1 className="page__title">友链</h1>
          <p className="page__desc">
            {loading ? '正在把朋友们的站点搬过来…' : `共 ${links.length} 位朋友 · 交换链接，也交换各自看世界的方式`}
          </p>
        </div>
        <Button type="button" variant="primary" icon="plus" onClick={openWizard}>
          申请友链
        </Button>
      </div>

      {loading ? (
        <div className="grid-cards">
          {Array.from({ length: 6 }).map((_, index) => (
            <FriendLinkSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <Glass className="friend-panel">
          <EmptyState
            icon="alert"
            title="友链加载失败"
            desc={error}
            action={
              <Button type="button" variant="primary" icon="refresh" onClick={reload}>
                重新加载
              </Button>
            }
          />
        </Glass>
      ) : links.length === 0 ? (
        <Glass className="friend-panel">
          <EmptyState icon="link" title="还没有添加友链" desc="点页面上的「申请友链」，成为第一个留在这里的人。" />
        </Glass>
      ) : (
        <div className="grid-cards">
          {links.map((link) => (
            <FriendCard key={link.id} link={link} />
          ))}
        </div>
      )}

      <Modal
        open={wizardOpen}
        onClose={closeWizard}
        title="申请友链"
        size="md"
        maskClosable={!pending}
        footer={wizardFooter}
      >
        {/* 步进条：只做状态展示，step 由页脚按钮推进 */}
        <ol className="wizard-steps">
          {STEPS.map((label, index) => {
            const order = index + 1
            const state = order === step ? 'active' : order < step ? 'done' : 'todo'
            return (
              <li
                key={label}
                className={cx('wizard-steps__item', `wizard-steps__item--${state}`)}
                aria-current={order === step ? 'step' : undefined}
              >
                <span className="wizard-steps__index">
                  {order < step ? <Icon name="check" size={12} strokeWidth={2.2} /> : order}
                </span>
                <span className="wizard-steps__label">{label}</span>
                {order < STEPS.length && <span className="wizard-steps__line" aria-hidden="true" />}
              </li>
            )
          })}
        </ol>

        {step === 1 ? stepNotes : step === 2 ? stepSiteInfo : stepForm}
      </Modal>
    </div>
  )
}
