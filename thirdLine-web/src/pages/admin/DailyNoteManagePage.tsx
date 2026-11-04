import { lazy, Suspense, useState, type FormEvent } from 'react'
import { dailyNoteApi, beijingToday, moodOptions, weatherOptions, type DailyNoteDTO, type DailyNoteVO } from '@/api/dailyNote'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { DailyNoteLabel } from '@/components/DailyNoteLabel'
import { Button } from '@/components/Button'
import { Badge, Field, Input, Select } from '@/components/Form'
import { ConfirmDialog, Modal } from '@/components/Modal'
import { EmptyState, Pagination, TableSkeleton } from '@/components/Feedback'
import { errorMessage } from '@/utils/format'

const RichEditor = lazy(() => import('@/components/RichEditor').then((m) => ({ default: m.RichEditor })))
const statuses = [{ value: 0, label: '草稿' }, { value: 1, label: '已发布' }]

export function DailyNoteManagePage() {
  const toast = useToast()
  const [status, setStatus] = useState<number>()
  const list = usePaginatedList((page, size) => dailyNoteApi.adminPage(page, size, status), [status], 10)
  const [form, setForm] = useState<DailyNoteDTO | null>(null)
  const [error, setError] = useState('')
  const [savingStatus, setSavingStatus] = useState<0 | 1 | null>(null)
  const saving = savingStatus !== null
  const [action, setAction] = useState<{ kind: 'delete' | 'publish'; item: DailyNoteVO } | null>(null)
  const [acting, setActing] = useState(false)
  const open = (item?: DailyNoteVO) => {
    setError('')
    setForm(item ? { id: item.id, noteDate: item.noteDate, content: item.content || '', mood: item.mood, weather: item.weather, publishStatus: item.publishStatus }
      : { noteDate: beijingToday(), content: '', mood: null, weather: null, publishStatus: 0 })
  }
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form || saving) return
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const publishStatus = submitter?.value === '1' ? 1 : 0
    if (!form.noteDate || form.noteDate < '1000-01-01' || form.noteDate > beijingToday()) {
      setError('请选择有效日期，不能晚于北京时间今天'); return
    }
    if (publishStatus === 1 && (form.mood === null || form.weather === null)) {
      setError('发布时请选择心情和天气'); return
    }
    setSavingStatus(publishStatus)
    setError('')
    try {
      const dto = { ...form, publishStatus }
      if (form.id) await dailyNoteApi.update(dto)
      else await dailyNoteApi.create(dto)
      toast.success(publishStatus === 1 ? '小记已保存并发布' : '草稿已保存')
      setForm(null)
      list.reload()
    } catch (err) { setError(errorMessage(err)) }
    finally { setSavingStatus(null) }
  }
  const execute = async () => {
    if (!action || acting) return
    setActing(true)
    try {
      if (action.kind === 'delete') await dailyNoteApi.remove(action.item.id)
      else await dailyNoteApi.update({ ...action.item, publishStatus: action.item.publishStatus === 1 ? 0 : 1 })
      toast.success(action.kind === 'delete' ? '小记已删除' : '发布状态已更新')
      setAction(null)
      if (action.kind === 'delete' && list.records.length === 1 && list.page > 1) list.setPage(list.page - 1)
      else list.reload()
    } catch (err) { toast.error(errorMessage(err)) }
    finally { setActing(false) }
  }
  return <div className="stack">
    <div className="admin-page-head"><div><h1 className="admin-page-head__title">小记管理</h1>
      <p className="admin-page-head__desc">每天一条，记下日常。草稿占用日期，发布后所有访客可见。</p></div>
      <Button icon="plus" disabled={acting} onClick={() => open()}>写小记</Button></div>
    <Glass className="panel panel--flush">
      <div className="filter-bar"><Select aria-label="筛选发布状态" placeholder="全部发布状态" options={statuses} value={status}
        onChange={(e) => { setStatus(e.target.value === '' ? undefined : Number(e.target.value)); list.setPage(1) }} /></div>
      <div aria-busy={list.loading || list.refreshing}>{list.loading ? <TableSkeleton columns={5} /> : list.error ?
        <EmptyState icon="alert" title="小记加载失败" desc={list.error} action={<Button onClick={list.reload}>重试</Button>} /> : !list.records.length ?
        <EmptyState icon="article" title="暂无小记" desc="写下一点今天的故事，或调整筛选条件。" /> :
        <div className="table-wrap"><table className="table"><thead><tr><th>小记日期</th><th>心情 / 天气</th><th>状态</th><th>最近发布时间</th><th>操作</th></tr></thead>
          <tbody>{list.records.map((item) => <tr key={item.id}>
            <td><time dateTime={item.noteDate}>{item.noteDate}</time></td>
            <td><div className="daily-note-labels"><DailyNoteLabel kind="mood" value={item.mood} /><span aria-hidden="true">/</span><DailyNoteLabel kind="weather" value={item.weather} /></div></td>
            <td><Badge tone={item.publishStatus === 1 ? 'success' : 'neutral'}>{item.publishStatus === 1 ? '已发布' : '草稿'}</Badge></td>
            <td>{item.publishTime?.replace('T', ' ') ?? '尚未发布'}</td>
            <td><div className="table__actions">
              <Button variant="ghost" size="sm" disabled={acting || list.refreshing} onClick={() => open(item)}>编辑</Button>
              <Button variant="ghost" size="sm" disabled={acting || list.refreshing} onClick={() => setAction({ kind: 'publish', item })}>{item.publishStatus === 1 ? '转为草稿' : '发布'}</Button>
              <Button variant="ghost" size="sm" disabled={acting || list.refreshing} onClick={() => setAction({ kind: 'delete', item })}>删除</Button>
            </div></td>
          </tr>)}</tbody></table></div>}</div>
      {!list.error && <Pagination current={list.page} total={list.total} size={list.size} onChange={list.setPage} onSizeChange={list.setSize} />}
    </Glass>
    <Modal open={form !== null} size="xl" title={form?.id ? '编辑小记' : '写小记'} maskClosable={false} onClose={() => { if (!saving) setForm(null) }}
      footer={<><Button variant="ghost" disabled={saving} onClick={() => setForm(null)}>取消</Button>
        <Button type="submit" form="daily-note-form" name="publishStatus" value="0" disabled={saving} loading={savingStatus === 0}>保存草稿</Button>
        <Button type="submit" form="daily-note-form" name="publishStatus" value="1" variant="primary" disabled={saving} loading={savingStatus === 1}>发布</Button></>}>
      {form && <form id="daily-note-form" className="stack" onSubmit={save}>
        <div className="note-form-grid">
          <Field label="小记日期" required hint="北京时间，可补录过去，每日一条"><Input type="date" aria-label="小记日期" min="1000-01-01" max={beijingToday()} required disabled={saving}
            value={form.noteDate} onChange={(e) => setForm({ ...form, noteDate: e.target.value })} /></Field>
          <Field label="心情" hint="发布时必选"><Select aria-label="心情" placeholder="请选择心情" options={moodOptions} disabled={saving}
            value={form.mood ?? ''} onChange={(e) => setForm({ ...form, mood: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
          <Field label="天气" hint="发布时必选"><Select aria-label="天气" placeholder="请选择天气" options={weatherOptions} disabled={saving}
            value={form.weather ?? ''} onChange={(e) => setForm({ ...form, weather: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
        </div>
        <Field label="正文" hint="发布时必填。直接输入文字，复制图片后在正文中粘贴即可">
          <Suspense fallback={<p role="status">正在加载编辑器…</p>}><RichEditor value={form.content} onChange={(content) => setForm((current) => current ? { ...current, content } : null)}
            simple placeholder="写下今天的小事，也可以直接粘贴图片…" minHeight={320} readOnly={saving} /></Suspense>
        </Field>
        {error && <p className="field__error" role="alert">{error}</p>}
      </form>}
    </Modal>
    <ConfirmDialog open={action !== null} title={action?.kind === 'delete' ? '删除小记' : action?.item.publishStatus === 1 ? '转为草稿' : '发布小记'}
      message={action?.kind === 'delete' ? '删除后无法恢复，确认删除这条小记？' : action?.item.publishStatus === 1 ? '转为草稿后，访客将无法看到这条小记。' : '发布后，所有访客都可以看到这条小记。'}
      danger={action?.kind === 'delete'} loading={acting} onConfirm={execute} onCancel={() => { if (!acting) setAction(null) }} />
  </div>
}
