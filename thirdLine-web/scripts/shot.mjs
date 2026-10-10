/**
 * 一次性验证脚本（不属于前端项目产物，仅供开发期截图核对）：
 * 通过 Chrome DevTools Protocol 打开页面、等待渲染、截图，
 * 并可用 Emulation.setEmulatedMedia 强制暗色模式。
 *
 * 用法: node scripts/shot.mjs <outDir> <chromePath> [theme]
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const [outDir, chromePath, theme = 'light'] = process.argv.slice(2)
const PORT = 9333
const BASE = 'http://127.0.0.1:5199'

mkdirSync(outDir, { recursive: true })

const pages = [
  { name: 'home', path: '/', wait: 7000, full: true },
  { name: 'register', path: '/register', wait: 3500 },
  { name: 'login', path: '/login', wait: 4500 },
  { name: 'gallery', path: '/gallery', wait: 3500 },
  { name: 'about', path: '/about', wait: 3500, full: true },
  { name: 'portfolio', path: '/portfolio', wait: 3500 },
]

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + outDir + '/profile-' + theme,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

async function getWsUrl() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const json = await res.json()
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl
    } catch {
      /* 还没起来 */
    }
    await sleep(250)
  }
  throw new Error('Chrome 调试端口未就绪')
}

let messageId = 0
function createClient(ws) {
  const pending = new Map()
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(JSON.stringify(msg.error)))
      else resolve(msg.result)
    }
  })
  return (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++messageId
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params, sessionId }))
    })
}

const wsUrl = await getWsUrl()
const ws = new WebSocket(wsUrl)
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }))
const send = createClient(ws)

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)
await send(
  'Emulation.setDeviceMetricsOverride',
  { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false },
  sessionId,
)

// 强制颜色方案：让 CSS 的 prefers-color-scheme 与 data-theme 都能命中
await send(
  'Emulation.setEmulatedMedia',
  { features: [{ name: 'prefers-color-scheme', value: theme }] },
  sessionId,
)

const consoleErrors = []
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    consoleErrors.push('EXCEPTION: ' + (msg.params.exceptionDetails.exception?.description ?? ''))
  }
})

for (const page of pages) {
  // 暗色模式：在应用启动前写入 localStorage，避免依赖按钮点击时序
  if (theme === 'dark') {
    await send('Page.navigate', { url: BASE + '/about' }, sessionId)
    await sleep(1500)
    await send(
      'Runtime.evaluate',
      { expression: `localStorage.setItem('tl_theme', 'dark')` },
      sessionId,
    )
  }

  await send('Page.navigate', { url: BASE + page.path }, sessionId)
  await sleep(page.wait)

  const shot = await send(
    'Page.captureScreenshot',
    { format: 'png', captureBeyondViewport: Boolean(page.full) },
    sessionId,
  )
  const file = `${outDir}/${theme}-${page.name}.png`
  writeFileSync(file, Buffer.from(shot.data, 'base64'))

  const title = await send('Runtime.evaluate', { expression: 'document.title' }, sessionId)
  const bodyLen = await send(
    'Runtime.evaluate',
    { expression: 'document.body.innerText.trim().length' },
    sessionId,
  )
  const themeAttr = await send(
    'Runtime.evaluate',
    { expression: 'document.documentElement.getAttribute("data-theme")' },
    sessionId,
  )
  console.log(
    `${page.name.padEnd(10)} -> ${file}  title="${title.result.value}" textLen=${bodyLen.result.value} data-theme=${themeAttr.result.value}`,
  )
}

if (consoleErrors.length) {
  console.log('\n--- 控制台错误 ---')
  consoleErrors.slice(0, 20).forEach((e) => console.log('  ' + e))
} else {
  console.log('\n控制台无错误')
}

ws.close()
chrome.kill()
process.exit(0)
