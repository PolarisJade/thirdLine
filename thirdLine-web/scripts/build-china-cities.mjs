/**
 * 构建期一次性脚本：把 chinese-global-compliant-geodata 的全国市级 geojson
 * 瘦身成足迹地图用的静态文件。
 *
 * 数据源（MIT）：https://github.com/JayMuShui/chinese-global-compliant-geodata
 * 取的字段：
 *   name       简称，如「长沙」
 *   full_name  全称，如「长沙市」
 *   province   所属省级全称，如「湖南省」
 *   gb         156 + 6 位行政区划代码，如「156430100」
 *
 * 产出：
 *   public/map/china-cities.json  前端 fetch 的地图数据（只留 adcode/名称/省份）
 *   src/data/china-cities.ts      后台录入用的「省 → 市」级联数据
 *
 * 用法（先准备数据文件）：
 *   npm pack chinese-global-compliant-geodata --pack-destination .cache
 *   tar -xzf .cache/chinese-global-compliant-geodata-1.0.0.tgz -C .cache
 *   node scripts/build-china-cities.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

/** 数据包可能已被解压到 .cache，也可能作为依赖装在 node_modules */
const CANDIDATES = [
  path.join(ROOT, '.cache/package/dist/src/geojson/countries/as/chn/global'),
  path.join(ROOT, 'node_modules/chinese-global-compliant-geodata/dist/src/geojson/countries/as/chn/global'),
]
const SRC_DIR = CANDIDATES.find((dir) => fs.existsSync(path.join(dir, 'chn-level-2.json')))

if (!SRC_DIR) {
  console.error('找不到 chn-level-2.json，请先按脚本头部的命令下载数据包。')
  process.exit(1)
}

const OUT_GEO = path.join(ROOT, 'public/map/china-cities.json')
const OUT_TS = path.join(ROOT, 'src/data/china-cities.ts')

const level1 = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'chn-level-1.json'), 'utf8'))
const level2 = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'chn-level-2.json'), 'utf8'))

/** 坐标保留 4 位小数（约 11 米），肉眼无差异，文件能小一截 */
function roundGeometry(geometry) {
  const walk = (coords) =>
    typeof coords[0] === 'number'
      ? coords.map((value) => Math.round(value * 1e4) / 1e4)
      : coords.map(walk)
  return { type: geometry.type, coordinates: walk(geometry.coordinates) }
}

const adcodeOf = (gb) => String(gb).slice(3)

/* --------------------------------------------------- 省级：code + 全称映射 */

const provinces = []
const provinceByName = new Map()

for (const feature of level1.features) {
  const gb = feature.properties?.gb
  if (!gb || !feature.geometry) continue
  const code = adcodeOf(gb)
  const name = feature.properties.full_name || feature.properties.name
  provinces.push({ code, name })
  // 简称和全称都登记一份，兼容 level-2 里 province 字段的两种写法
  provinceByName.set(name, { code, name })
  provinceByName.set(feature.properties.name, { code, name })
}

/* ----------------------------------------------------- 市级：城市 + 地图面 */

const cities = []
const features = []
const seen = new Set()

for (const feature of level2.features) {
  const gb = feature.properties?.gb
  // 数据里混有「不含 GB 码的境界线」要素，直接丢掉
  if (!gb || !feature.geometry) continue
  const adcode = adcodeOf(gb)
  if (seen.has(adcode)) continue
  seen.add(adcode)

  const provinceName = feature.properties.province
  const province = provinceByName.get(provinceName) ?? {
    code: `${adcode.slice(0, 2)}0000`,
    name: provinceName,
  }
  const fullName = feature.properties.full_name || feature.properties.name

  cities.push({ adcode, name: fullName, provinceCode: province.code, provinceName: province.name })
  features.push({
    type: 'Feature',
    properties: {
      adcode,
      name: feature.properties.name,
      full_name: fullName,
      province: province.name,
      provinceCode: province.code,
    },
    geometry: roundGeometry(feature.geometry),
  })
}

/**
 * 港澳台这类「省级即城市」的区域，level-2 里可能没有对应的市级要素。
 * 用省级轮廓补一个城市面，保证 34 个省级区域都能在地图上被点亮。
 */
const covered = new Set(cities.map((city) => city.provinceCode))
for (const province of provinces) {
  if (covered.has(province.code)) continue
  const feature = level1.features.find((item) => item.properties?.gb && adcodeOf(item.properties.gb) === province.code)
  if (!feature?.geometry) continue

  covered.add(province.code)
  seen.add(province.code)
  cities.push({ adcode: province.code, name: province.name, provinceCode: province.code, provinceName: province.name })
  features.push({
    type: 'Feature',
    properties: {
      adcode: province.code,
      name: province.name,
      full_name: province.name,
      province: province.name,
      provinceCode: province.code,
    },
    geometry: roundGeometry(feature.geometry),
  })
}

/* ------------------------------------------------------------------ 输出 */

cities.sort((a, b) => a.provinceCode.localeCompare(b.provinceCode) || a.adcode.localeCompare(b.adcode))
features.sort((a, b) => a.properties.adcode.localeCompare(b.properties.adcode))
provinces.sort((a, b) => a.code.localeCompare(b.code))

fs.mkdirSync(path.dirname(OUT_GEO), { recursive: true })
fs.writeFileSync(OUT_GEO, JSON.stringify({ type: 'FeatureCollection', features }))

const ts = `/**
 * 中国省级 / 市级行政区划数据（构建期由 scripts/build-china-cities.mjs 生成，勿手改）。
 * 数据来源：chinese-global-compliant-geodata（MIT）。
 */

export interface ChinaProvince {
  code: string
  name: string
}

export interface ChinaCity {
  adcode: string
  name: string
  provinceCode: string
  provinceName: string
}

export const CHINA_PROVINCES: ChinaProvince[] = ${JSON.stringify(provinces)}

export const CHINA_CITIES: ChinaCity[] = ${JSON.stringify(cities)}
`
fs.mkdirSync(path.dirname(OUT_TS), { recursive: true })
fs.writeFileSync(OUT_TS, ts)

/* -------------------------------------------------------------- 自检输出 */

const kb = (bytes) => `${(bytes / 1024).toFixed(0)}KB`
const unique = new Set(cities.map((city) => city.adcode)).size

console.log(`来源：${SRC_DIR}`)
console.log(`省级 ${provinces.length} 个，城市 ${cities.length} 个，adcode 唯一数 ${unique}`)
console.log(`地图文件 ${kb(fs.statSync(OUT_GEO).size)}，下拉数据 ${kb(fs.statSync(OUT_TS).size)}`)

for (const keyword of ['三沙', '香港', '澳门', '台湾', '北京', '长沙']) {
  const hits = cities
    .filter((city) => city.name.includes(keyword))
    .map((city) => `${city.adcode}:${city.name}`)
    .slice(0, 4)
  console.log(`  ${keyword} -> ${hits.length ? hits.join(' / ') : '缺失'}`)
}
