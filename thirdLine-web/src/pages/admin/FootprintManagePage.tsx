import { useState, type FormEvent } from 'react'
import { footprintApi, type FootprintAdminVO, type FootprintDTO } from '@/api'
import { useDebounced } from '@/hooks/useAsync'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Badge, Field, Input, Select, SwitchRow, Textarea } from '@/components/Form'
import { ConfirmDialog, Modal } from '@/components/Modal'
import { EmptyState, Pagination, TableSkeleton } from '@/components/Feedback'
import { errorMessage } from '@/utils/format'
import { CHINA_CITIES, CHINA_PROVINCES } from '@/data/china-cities'

type Action = { kind: 'delete' | 'publish' | 'status'; item: FootprintAdminVO }
type Errors = Partial<Record<'city' | 'visitDate' | 'content' | 'submit', string>>

interface Form {
  id?: number
  provinceCode: string
  cityCode: string
  visitDate: string
  content: string
  publishStatus: number
  status: number
}

function newForm(): Form {
  return { provinceCode: '', cityCode: '', visitDate: '', content: '', publishStatus: 0, status: 1 }
}

/**
 * 足迹管理。
 * 列表：GET /admin/footprint/page
 * 增删改：POST / PUT / DELETE /admin/footprint
 * 城市用「省 → 市」级联选择，直接写入 adcode，保证和地图区域一一对应。
 */
export function FootprintManagePage() {
  const toast = useToast()

  const [keyword, setKeyword] = useState('')
  const search = useDebounced(keyword)
  const [publishStatus, setPublishStatus] = useState<number>()
  const [status, setStatus] = useState<number>()
  const list = usePaginatedList<FootprintAdminVO>(
    (page, size) =>
      footprintApi.adminPage({ page, size, keyword: search.trim() || undefined, publishStatus, status }),
    [search, publishStatus, status],
    10,
  )

  const [form, setForm] = useState<Form | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [action, setAction] = useState<Action | null>(null)
  const [acting, setActing] = useState(false)

  const openForm = (item?: FootprintAdminVO) => {
    setErrors({})
    setForm(
      item
        ? {
            id: item.id,
            provinceCode: item.provinceCode,
            cityCode: item.cityCode,
            visitDate: item.visitDate ?? '',
            content: item.content ?? '',
            publishStatus: item.publishStatus,
            status: item.status,
          }
        : newForm(),
    )
  }

  const cityOptions = form
    ? CHINA_CITIES.filter((city) => city.provinceCode === form.provinceCode).map((city) => ({
        label: city.name,
        value: city.adcode,
      }))
    : []

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!form || saving) return

    const city = CHINA_CITIES.find((item) => item.adcode === form.cityCode)
    const nextErrors: Errors = {}
    if (!city) nextErrors.city = '请选择城市'
    if (form.visitDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.visitDate)) nextErrors.visitDate = '请填写有效到访日期'
    if (new TextEncoder().encode(form.content.trim()).length > 65535) nextErrors.content = '评价过长，请缩短内容'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || !city) return

    setSaving(true)
    try {
      const dto: FootprintDTO = {
        id: form.id,
        cityCode: city.adcode,
        cityName: city.name,
        provinceCode: city.provinceCode,
        provinceName: city.provinceName,
        visitDate: form.visitDate || null,
        content: form.content.trim(),
        publishStatus: form.publishStatus,
        status: form.status,
      }
      if (form.id) {
        await footprintApi.update(dto)
        toast.success('足迹已更新')
      } else {
        await footprintApi.create(dto)
        toast.success(form.publishStatus === 1 ? '足迹已发布' : '草稿已保存')
      }
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
      if (kind === 'delete') await footprintApi.remove(item.id)
      else if (kind === 'publish') await footprintApi.changePublishStatus(item.id, item.publishStatus === 1 ? 0 : 1)
      else await footprintApi.changeStatus(item.id, item.status === 1 ? 0 : 1)
      toast.success(kind === 'delete' ? '足迹已删除' : '状态已更新')
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
  const busy = acting || list.refreshing
  const confirmTitle = !action
    ? ''
    : action.kind === 'delete'
      ? '删除足迹'
      : action.kind === 'publish'
        ? action.item.publishStatus === 1
          ? '转为草稿'
          : '发布足迹'
        : action.item.status === 1
          ? '隐藏足迹'
          : '显示足迹'
  const confirmMessage = !action
    ? ''
    : action.kind === 'delete'
      ? '删除后无法恢复；该城市下的照片会保留在相册中，不会一起删除。'
      : action.kind === 'publish'
        ? action.item.publishStatus === 1
          ? '转为草稿后，前台地图上不再高亮这座城市。'
          : action.item.status === 1
            ? '发布后，这座城市会立即在地图上高亮。'
            : '发布后仍保持隐藏，需要切换为显示才会出现在地图上。'
        : action.item.status === 1
          ? '隐藏后，前台地图上不再高亮这座城市。'
          : action.item.publishStatus === 1
            ? '显示后，这座城市会立即出现在地图上。'
            : '显示后仍是草稿，发布后才会出现在地图上。'

  return (
    <div className="stack">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">足迹管理</h1>
          <p className="admin-page-head__desc">录入走过的城市；已发布且显示的城市会在地图上高亮。</p>
        </div>
        <Button icon="plus" onClick={() => openForm()} disabled={acting}>
          新增城市
        </Button>
      </div>

      <Glass className="panel panel--flush">
        <div className="filter-bar">
          <Input
            aria-label="搜索城市或省份"
            icon="search"
            placeholder="搜索城市或省份"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              resetPage()
            }}
          />
          <Select
            aria-label="筛选发布状态"
            placeholder="全部发布状态"
            options={[
              { label: '草稿', value: 0 },
              { label: '已发布', value: 1 },
            ]}
            value={publishStatus}
            onChange={(event) => {
              setPublishStatus(event.target.value === '' ? undefined : Number(event.target.value))
              resetPage()
            }}
          />
          <Select
            aria-label="筛选展示状态"
            placeholder="全部展示状态"
            options={[
              { label: '显示', value: 1 },
              { label: '隐藏', value: 0 },
            ]}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value === '' ? undefined : Number(event.target.value))
              resetPage()
            }}
          />
        </div>

        <div aria-busy={list.loading || list.refreshing}>
          {list.loading ? (
            <TableSkeleton columns={6} />
          ) : list.error ? (
            <EmptyState
              icon="alert"
              title="足迹加载失败"
              desc={list.error}
              action={
                <Button variant="glass" onClick={list.reload}>
                  重试
                </Button>
              }
            />
          ) : list.records.length === 0 ? (
            <EmptyState
              icon="flag"
              title="还没有足迹"
              desc="新增一座走过的城市，它会出现在前台地图上。"
              action={
                <Button variant="glass" onClick={() => openForm()}>
                  新增城市
                </Button>
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>城市</th>
                    <th>到访日期</th>
                    <th>照片</th>
                    <th>发布状态</th>
                    <th>展示状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.records.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="cell-title">{item.cityName}</div>
                        <div className="cell-sub">{item.provinceName}</div>
                      </td>
                      <td>
                        <span className="text-sm text-muted">{item.visitDate || '未填写'}</span>
                      </td>
                      <td>
                        <span className="text-sm text-muted">{item.photoCount} 张</span>
                      </td>
                      <td>
                        <Badge tone={item.publishStatus === 1 ? 'success' : 'neutral'}>
                          {item.publishStatus === 1 ? '已发布' : '草稿'}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={item.status === 1 ? 'default' : 'neutral'}>
                          {item.status === 1 ? '显示' : '隐藏'}
                        </Badge>
                      </td>
                      <td>
                        <div className="table__actions">
                          <Button variant="ghost" size="sm" disabled={busy} onClick={() => openForm(item)}>
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => setAction({ kind: 'publish', item })}
                          >
                            {item.publishStatus === 1 ? '转为草稿' : '发布'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => setAction({ kind: 'status', item })}
                          >
                            {item.status === 1 ? '隐藏' : '显示'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => setAction({ kind: 'delete', item })}
                          >
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!list.error && (
          <Pagination
            current={list.page}
            total={list.total}
            size={list.size}
            onChange={list.setPage}
            onSizeChange={list.setSize}
          />
        )}
      </Glass>

      <Modal
        open={form !== null}
        title={form?.id ? '编辑足迹' : '新增城市'}
        size="lg"
        maskClosable={false}
        onClose={() => {
          if (!saving) setForm(null)
        }}
        footer={
          <>
            <Button variant="ghost" disabled={saving} onClick={() => setForm(null)}>
              取消
            </Button>
            <Button type="submit" form="footprint-form" loading={saving}>
              {form?.id ? '保存修改' : form?.publishStatus === 1 ? '保存并发布' : '保存草稿'}
            </Button>
          </>
        }
      >
        {form && (
          <form id="footprint-form" className="stack" onSubmit={save} noValidate>
            <div className="history-form-grid">
              <Field label="省份 / 直辖市" required error={errors.city}>
                <Select
                  aria-label="选择省份"
                  placeholder="请选择省份"
                  options={CHINA_PROVINCES.map((province) => ({ label: province.name, value: province.code }))}
                  value={form.provinceCode}
                  disabled={saving}
                  onChange={(event) =>
                    setForm({ ...form, provinceCode: event.target.value, cityCode: '' })
                  }
                />
              </Field>
              <Field label="城市" required hint="城市代码来自行政区划 adcode，与地图区域一一对应">
                <Select
                  aria-label="选择城市"
                  placeholder={form.provinceCode ? '请选择城市' : '请先选择省份'}
                  options={cityOptions}
                  value={form.cityCode}
                  disabled={saving || !form.provinceCode}
                  onChange={(event) => setForm({ ...form, cityCode: event.target.value })}
                />
              </Field>
            </div>

            <Field label="到访日期" hint="精确到天，可留空；也用于地图详情的时间线" error={errors.visitDate}>
              <Input
                aria-label="到访日期"
                type="date"
                value={form.visitDate}
                disabled={saving}
                onChange={(event) => setForm({ ...form, visitDate: event.target.value })}
              />
            </Field>

            <Field label="城市评价" hint="纯文本，支持换行；留空则只高亮城市" error={errors.content}>
              <Textarea
                aria-label="城市评价"
                rows={7}
                value={form.content}
                disabled={saving}
                placeholder="这座城市给你留下了什么印象？"
                onChange={(event) => setForm({ ...form, content: event.target.value })}
              />
            </Field>

            {!form.id && (
              <>
                <SwitchRow
                  label="立即发布"
                  desc="关闭时保存为草稿"
                  checked={form.publishStatus === 1}
                  disabled={saving}
                  onChange={(checked) => setForm({ ...form, publishStatus: checked ? 1 : 0 })}
                />
                <SwitchRow
                  label="前台显示"
                  desc="只有已发布且显示时，访客才能在地图上看到"
                  checked={form.status === 1}
                  disabled={saving}
                  onChange={(checked) => setForm({ ...form, status: checked ? 1 : 0 })}
                />
              </>
            )}

            {errors.submit && (
              <p className="field__error" role="alert">
                {errors.submit}
              </p>
            )}
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={action !== null}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={confirmTitle}
        danger={action?.kind === 'delete'}
        loading={acting}
        onConfirm={execute}
        onCancel={() => {
          if (!acting) setAction(null)
        }}
      />
    </div>
  )
}
