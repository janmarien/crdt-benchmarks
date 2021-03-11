
import { setBenchmarkResult } from './utils.js'

if (typeof global !== 'undefined' && typeof window === 'undefined') {
  const fs = require('fs')
  const pkgLock = JSON.parse(fs.readFileSync(__dirname + '/../package-lock.json', 'utf8'))

  const yjsBundleSize = fs.statSync(__dirname + '/../dist/bundleYjs.js').size
  const deltaCrdtsBundleSize = fs.statSync(__dirname + '/../dist/bundleDeltaCrdts.js').size
  const automergeBundleSize = fs.statSync(__dirname + '/../dist/bundleAutomerge.js').size
  const fluidBundleSize = fs.statSync(__dirname + '/../dist/bundleFluid.js').size
  const yjsGzBundleSize = fs.statSync(__dirname + '/../dist/bundleYjs.js.gz').size
  const deltaCrdtsGzBundleSize = fs.statSync(__dirname + '/../dist/bundleDeltaCrdts.js.gz').size
  const automergeGzBundleSize = fs.statSync(__dirname + '/../dist/bundleAutomerge.js.gz').size
  const fluidGzBundleSize = fs.statSync(__dirname + "/../dist/bundleFluid.js.gz").size

  const yjsVersion = pkgLock.dependencies.yjs.version
  const deltaCrdtsVersion = pkgLock.dependencies['delta-crdts'].version
  const automergeVersion = pkgLock.dependencies.automerge.version
  const fluidVersion = pkgLock.dependencies['@fluidframework/test-utils'].version

  setBenchmarkResult('yjs', 'Version', yjsVersion)
  setBenchmarkResult('delta-crdts', 'Version', deltaCrdtsVersion)
  setBenchmarkResult('automerge', 'Version', automergeVersion)
  setBenchmarkResult('fluid', 'Version', fluidVersion)

  setBenchmarkResult('yjs', 'Bundle size', `${yjsBundleSize} bytes`)
  setBenchmarkResult('delta-crdts', 'Bundle size', `${deltaCrdtsBundleSize} bytes`)
  setBenchmarkResult('automerge', 'Bundle size', `${automergeBundleSize} bytes`)
  setBenchmarkResult('fluid', 'Bundle size', `${fluidBundleSize} bytes`)
  setBenchmarkResult('yjs', 'Bundle size (gzipped)', `${yjsGzBundleSize} bytes`)
  setBenchmarkResult('delta-crdts', 'Bundle size (gzipped)', `${deltaCrdtsGzBundleSize} bytes`)
  setBenchmarkResult('automerge', 'Bundle size (gzipped)', `${automergeGzBundleSize} bytes`)
  setBenchmarkResult('fluid', 'Bundle size (gzipped)', `${fluidGzBundleSize} bytes`)
}
