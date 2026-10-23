import { useState, type FormEvent } from 'react'
import { siteHistoryApi, type SiteHistoryAdminVO, type SiteHistoryDTO } from '@/api'
import { useAsync, useDebounced } from '@/hooks/useAsync'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Badge, Field, Input, Select, SwitchRow, Textarea } from '@/components/Form'
import { ConfirmDialog, Modal } from '@/components/Modal'
import { EmptyState, Pagination, TableSkeleton } from '@/components/Feedback'
import { errorMessage } from '@/utils/format'

type Action = { kind: 'delete' | 'publish' | 'status'; item: SiteHistoryAdminVO }
type Errors = Partial<Record<'description' | 'version' | 'updateDate' | 'updateType' | 'submit', string>>

function newForm(): SiteHistoryDTO {
  const now = new Date()
  // 使用本地年月日，避免 UTC 转换造成日期偏移。
  const updateDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  return { description: '', version: '', updateDate, updateType: 0, publishStatus: 0, status: 1 }
}

export function SiteHistoryManagePage() {
  const toast = useToast()
  const options = useAsync(siteHistoryApi.options, [])
  const [keyword, setKeyword] = useState('')
  const search = useDebounced(keyword)
  const [updateType, setUpdateType] = useState<number>()
  const [publishStatus, setPublishStatus] = useState<number>()
  const [status, setStatus] = useState<number>()
  const list = usePaginatedList(
    (page, size) => siteHistoryApi.adminPage({ page, size, keyword: search.trim() || undefined, updateType, publishStatus, status }),
    [search, updateType, publishStatus, status], 10,
  )
  const [form, setForm] = useState<SiteHistoryDTO | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [action, setAction] = useState<Action | null>(null)
  const [acting, setActing] = useState(false)

  const openForm = (item?: SiteHistoryAdminVO) => {
    setErrors({})
    // 编辑内容不提交状态，保留发布和显隐操作的独立性。
    setForm(item ? {
      id: item.id, description: item.description, version: item.version,
      updateDate: item.updateDate, updateType: item.updateType,
    } : newForm())
  }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!form || saving) return
    const nextErrors: Errors = {}
    if (!form.description.trim()) nextErrors.description = '请填写更新说明'
    else if (new TextEncoder().encode(form.description.trim()).length > 65535) nextErrors.description = '更新说明过长，请缩短内容'
    if (!form.version.trim() || [...form.version.trim()].length > 32) nextErrors.version = '版本号不能为空且不能超过32个字符'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.updateDate) || form.updateDate < '1000-01-01' || form.updateDate > '9999-12-31') nextErrors.updateDate = '请填写有效更新日期'
    if (!options.data?.updateTypes.some((type) => type.value === form.updateType)) nextErrors.updateType = '请选择更新类型'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSaving(true)
    try {
      const dto = { ...form, description: form.description.trim(), version: form.version.trim() }
      if (form.id) await siteHistoryApi.update(dto)
      else await siteHistoryApi.create(dto)
      toast.success(form.id ? '历程已更新' : form.publishStatus === 1 ? '历程已发布' : '草稿已保存')
      setForm(null)
      list.reload()
    } catch (error) {
      setErrors({ submit: errorMessage(error) })
    } finally {
      setSaving(false)
    }
  }
  const execute = async () => {
    if (!action || acting) return
    setActing(true)
    try {
      const { kind, item } = action
      if (kind === 'delete') await siteHistoryApi.remove(item.id)
      else if (kind === 'publish') await siteHistoryApi.changePublishStatus(item.id, item.publishStatus === 1 ? 0 : 1)
      else await siteHistoryApi.changeStatus(item.id, item.status === 1 ? 0 : 1)
      toast.success(kind === 'delete' ? '历程已删除' : '状态已更新')
      setAction(null)
      if (kind === 'delete' && list.records.length === 1 && list.page > 1) list.setPage(list.page - 1)
      else list.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setActing(false)
    }
  }
  const resetPage = () => list.setPage(1)
  const optionData = options.data
  const busy = acting || list.refreshing
  const confirmTitle = !action ? '' : action.kind === 'delete' ? '删除历程'
    : action.kind === 'publish' ? (action.item.publishStatus === 1 ? '转为草稿' : '发布历程')
    : (action.item.status === 1 ? '隐藏历程' : '显示历程')
  const confirmMessage = !action ? '' : action.kind === 'delete' ? '删除后无法恢复，确认删除这条历程？'
    : action.kind === 'publish' ? (action.item.publishStatus === 1 ? '转为草稿后，前台将不再展示这条历程。'
      : action.item.status === 1 ? '发布后，这条历程会立即在前台展示。' : '发布后仍保持隐藏，需要切换为显示后才会在前台展示。')
    : action.item.status === 1 ? '隐藏后，前台将不再展示这条历程。'
      : action.item.publishStatus === 1 ? '显示后，这条已发布历程会立即在前台展示。' : '显示后仍是草稿，发布后才会在前台展示。'

  return (
    <div className="stack">
      <div className="admin-page-head">
        <div><h1 className="admin-page-head__title">历程管理</h1>
          <p className="admin-page-head__desc">记录网站更新；已发布且显示的历程会出现在前台。</p></div>
        <Button icon="plus" onClick={() => openForm()} disabled={acting}>新增历程</Button>
      </div>
      {options.error && <div role="alert" className="history-notice">
        更新类型加载失败：{options.error} <Button variant="ghost" size="sm" onClick={options.reload}>重试</Button>
      </div>}
      <Glass className="panel panel--flush">
        <div className="filter-bar history-filters">
          <Input aria-label="搜索版本或更新说明" icon="search" placeholder="搜索版本或更新说明"
            value={keyword} onChange={(e) => { setKeyword(e.target.value); resetPage() }} />
          <Select aria-label="筛选更新类型" placeholder="全部更新类型" options={optionData?.updateTypes ?? []}
            value={updateType} onChange={(e) => { setUpdateType(e.target.value === '' ? undefined : Number(e.target.value)); resetPage() }} />
          <Select aria-label="筛选发布状态" placeholder="全部发布状态" options={optionData?.publishStatuses ?? []}
            value={publishStatus} onChange={(e) => { setPublishStatus(e.target.value === '' ? undefined : Number(e.target.value)); resetPage() }} />
          <Select aria-label="筛选展示状态" placeholder="全部展示状态" options={optionData?.statuses ?? []}
            value={status} onChange={(e) => { setStatus(e.target.value === '' ? undefined : Number(e.target.value)); resetPage() }} />
        </div>
        <div aria-busy={list.loading || list.refreshing}>
          {list.loading ? <TableSkeleton columns={6} /> : list.error ? (
            <EmptyState icon="alert" title="历程加载失败" desc={list.error} action={<Button variant="glass" onClick={list.reload}>重试</Button>} />
          ) : list.records.length === 0 ? (
            <EmptyState icon="clock" title="暂无历程" desc="可以新增一条历程，或调整筛选条件。" action={<Button variant="glass" onClick={() => openForm()}>新增历程</Button>} />
          ) : (
            <div className="table-wrap"><table className="table history-table">
              <thead><tr><th>版本 / 更新日期</th><th>更新说明</th><th>更新类型</th><th>发布状态</th><th>展示状态</th><th>操作</th></tr></thead>
              <tbody>{list.records.map((item) => <tr key={item.id}>
                <td><div className="cell-title">{item.version}</div><time className="cell-sub" dateTime={item.updateDate}>{item.updateDate}</time></td>
                <td><p className="history-table__description">{item.description}</p></td>
                <td><Badge tone="info">{item.updateTypeLabel}</Badge></td>
                <td><Badge tone={item.publishStatus === 1 ? 'success' : 'neutral'}>{item.publishStatusLabel}</Badge></td>
                <td><Badge tone={item.status === 1 ? 'default' : 'neutral'}>{item.statusLabel}</Badge></td>
                <td><div className="table__actions">
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => openForm(item)}>编辑</Button>
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => setAction({ kind: 'publish', item })}>{item.publishStatus === 1 ? '转为草稿' : '发布'}</Button>
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => setAction({ kind: 'status', item })}>{item.status === 1 ? '隐藏' : '显示'}</Button>
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => setAction({ kind: 'delete', item })}>删除</Button>
                </div></td>
              </tr>)}</tbody>
            </table></div>
          )}
        </div>
        {!list.error && <Pagination current={list.page} total={list.total} size={list.size} onChange={list.setPage} onSizeChange={list.setSize} />}
      </Glass>
      <Modal open={form !== null} title={form?.id ? '编辑历程' : '新增历程'} maskClosable={false}
        onClose={() => { if (!saving) setForm(null) }}
        footer={<><Button variant="ghost" disabled={saving} onClick={() => setForm(null)}>取消</Button>
          <Button type="submit" form="history-form" loading={saving} disabled={!optionData}>{form?.id ? '保存修改' : form?.publishStatus === 1 ? '保存并发布' : '保存草稿'}</Button></>}>
        {form && <form id="history-form" className="stack" onSubmit={save} noValidate>
          <div className="history-form-grid">
            <Field label="版本号" required error={errors.version}><Input aria-label="版本号" value={form.version} maxLength={32} disabled={saving}
              placeholder="例如 v1.0.0" onChange={(e) => setForm({ ...form, version: e.target.value })} /></Field>
            <Field label="更新日期" required hint="精确到天，可补录过去的更新" error={errors.updateDate}><Input aria-label="更新日期" type="date" min="1000-01-01" max="9999-12-31"
              value={form.updateDate} disabled={saving} onChange={(e) => setForm({ ...form, updateDate: e.target.value })} /></Field>
          </div>
          <Field label="更新类型" required error={errors.updateType}><Select aria-label="更新类型" options={optionData?.updateTypes ?? []}
            value={form.updateType} disabled={saving || !optionData} onChange={(e) => setForm({ ...form, updateType: Number(e.target.value) })} /></Field>
          <Field label="更新说明" required hint="纯文本，支持换行" error={errors.description}><Textarea aria-label="更新说明"
            rows={7} value={form.description} disabled={saving} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          {!form.id && <>
            <SwitchRow label="立即发布" desc="关闭时保存为草稿" checked={form.publishStatus === 1} disabled={saving}
              onChange={(checked) => setForm({ ...form, publishStatus: checked ? 1 : 0 })} />
            <SwitchRow label="前台显示" desc="只有已发布且显示时，访客才能看到" checked={form.status === 1} disabled={saving}
              onChange={(checked) => setForm({ ...form, status: checked ? 1 : 0 })} />
          </>}
          {errors.submit && <p className="field__error" role="alert">{errors.submit}</p>}
        </form>}
      </Modal>
      <ConfirmDialog open={action !== null} title={confirmTitle} message={confirmMessage} confirmText={confirmTitle}
        danger={action?.kind === 'delete'} loading={acting} onConfirm={execute} onCancel={() => { if (!acting) setAction(null) }} />
    </div>
  )
}

