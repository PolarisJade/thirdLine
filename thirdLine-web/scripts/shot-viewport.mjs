/**
 * 一次性验证脚本：按真实视口截图（不展开页面），用于核对浮层定位。
 * 用法: node scripts/shot-viewport.mjs <outDir> <chromePath> <path> [name]
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const [outDir, chromePath, path = '/', name = 'view'] = process.argv.slice(2)
const PORT = 9334
const BASE = 'http://127.0.0.1:5199'

mkdirSync(outDir, { recursive: true })

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${outDir}/profile-vp`,
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
      /* 等 chrome 起来 */
    }
    await sleep(250)
  }
  throw new Error('Chrome 调试端口未就绪')
}

let id = 0
function createSend(ws) {
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
      const current = ++id
      pending.set(current, { resolve, reject })
      ws.send(JSON.stringify({ id: current, method, params, sessionId }))
    })
}

const ws = new WebSocket(await getWsUrl())
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }))
const send = createSend(ws)

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

await send('Page.enable', {}, sessionId)
await send(
  'Emulation.setDeviceMetricsOverride',
  { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
  sessionId,
)

await send('Page.navigate', { url: BASE + path }, sessionId)
await sleep(7000)

const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId)
writeFileSync(`${outDir}/${name}.png`, Buffer.from(shot.data, 'base64'))
console.log(`saved ${outDir}/${name}.png`)

ws.close()
chrome.kill()
process.exit(0)
