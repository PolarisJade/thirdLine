/**
 * 一次性诊断脚本：读取 .danmaku-layer 与 .hero 的几何信息，
 * 确认弹幕层是否被正确约束在 Hero 容器内。
 * 用法: node scripts/probe.mjs <chromePath>
 */
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const [chromePath] = process.argv.slice(2)
const PORT = 9335

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${process.env.TEMP}/tl-probe`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

async function ws() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const j = await r.json()
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl
    } catch {
      /* wait */
    }
    await sleep(250)
  }
  throw new Error('no cdp')
}

let id = 0
const pending = new Map()
const socket = new WebSocket(await ws())
await new Promise((r) => socket.addEventListener('open', r, { once: true }))
socket.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id)
    pending.delete(m.id)
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)
  }
})
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const cur = ++id
    pending.set(cur, { resolve, reject })
    socket.send(JSON.stringify({ id: cur, method, params, sessionId }))
  })

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, sessionId)
await send(
  'Emulation.setDeviceMetricsOverride',
  { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
  sessionId,
)
await send('Page.navigate', { url: 'http://127.0.0.1:5199/' }, sessionId)
await sleep(8000)

const result = await send(
  'Runtime.evaluate',
  {
    expression: `JSON.stringify((() => {
      const info = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left),
          w: Math.round(r.width), h: Math.round(r.height),
          position: cs.position, bottomCss: cs.bottom, paddingBottom: cs.paddingBottom,
          zIndex: cs.zIndex, overflow: cs.overflow,
        };
      };
      return {
        viewportH: window.innerHeight,
        hero: info('.hero'),
        heroInner: info('.hero__inner'),
        heroActions: info('.hero__actions'),
        layer: info('.danmaku-layer'),
        sender: info('.danmaku-sender--inline'),
        toggle: info('.danmaku-toggle'),
        senderSpaceVar: getComputedStyle(document.documentElement).getPropertyValue('--danmaku-sender-space'),
      };
    })())`,
  },
  sessionId,
)

console.log(JSON.stringify(JSON.parse(result.result.value), null, 2))

socket.close()
chrome.kill()
process.exit(0)
