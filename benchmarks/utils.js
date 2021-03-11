
import * as prng from 'lib0/prng.js'
import * as metric from 'lib0/metric.js'
import * as math from 'lib0/math.js'
import { TestContainerRuntimeFactory, TestObjectProvider, TestFluidObjectFactory} from '@fluidframework/test-utils'
import { LocalServerTestDriver, TinyliciousTestDriver } from '@fluidframework/test-drivers'
import { requestFluidObject } from '@fluidframework/runtime-utils'
import { Loader } from '@fluidframework/container-loader'


export const N = 6000
export const disableAutomergeBenchmarks = true
export const disablePeersCrdtsBenchmarks = true
export const disableYjsBenchmarks = false
export const disableFluidBenchmarks = false

export const benchmarkResults = {}

export const setBenchmarkResult = (libname, benchmarkid, result) => {
  console.info(libname, benchmarkid, result)
  const libResults = benchmarkResults[benchmarkid] || (benchmarkResults[benchmarkid] = {})
  libResults[libname] = result
}

const perf = typeof performance === 'undefined' ? require('perf_hooks').performance : performance // eslint-disable-line no-undef

export const benchmarkTime = async (libname, id, f) => {
  const start = perf.now()
  await f()
  const time = perf.now() - start
  setBenchmarkResult(libname, id, `${time.toFixed(0)} ms`)
}

/**
 * A Pseudo Random Number Generator with a constant seed, so that repeating the runs will use the same random values.
 */
export const gen = prng.create(42)

export const cpy = o => JSON.parse(JSON.stringify(o))

export const getMemUsed = () => {
  if (typeof global !== 'undefined' && typeof process !== 'undefined') {
    if (global.gc) {
      global.gc()
    }
    return process.memoryUsage().heapUsed
  }
  return 0
}

export const logMemoryUsed = (libname, id, startHeapUsed) => {
  if (typeof global !== 'undefined' && typeof process !== 'undefined') {
    if (global.gc) {
      global.gc()
    }
    const diff = process.memoryUsage().heapUsed - startHeapUsed
    const p = metric.prefix(diff)
    setBenchmarkResult(libname, `${id} (memUsed)`, `${math.round(math.max(p.n * 10, 0)) / 10} ${p.prefix}B`)
  }
}

export const tryGc = () => {
  if (typeof global !== 'undefined' && typeof process !== 'undefined' && global.gc) {
    global.gc()
  }
}

/**
 * Insert a string into a deltaRga crdt
 *
 * @param {any} doc
 * @param {number} index
 * @param {Array<any>|string} content
 * @return {Array<ArrayBuffer>}
 */
export const deltaInsertHelper = (doc, index, content) => {
  const deltas = []
  for (let i = 0; i < content.length; i++) {
    deltas.push(doc.insertAt(index + i, content[i]))
  }
  return deltas
}

/**
 * Insert a string into a deltaRga crdt
 *
 * @param {any} doc
 * @param {number} index
 * @param {number} length
 * @return {Array<ArrayBuffer>}
 */
export const deltaDeleteHelper = (doc, index, length) => {
  const deltas = []
  for (let i = 0; i < length; i++) {
    deltas.push(doc.removeAt(index))
  }
  return deltas
}

const USE_TINYLICIOUS = false;
let containers = [];

export const cleanContainers = async () => {
  for (const container of containers) {
    await container.close()
  }
  containers = []
}

/**
 * Initializes 2 Fluid containers
 * @param {*} sharedObjectFactory Factory of the sharedObject you would like to instantiate
 * @returns {Promise<Array<>>} Array containing the two sharedObjects and the OpProcessingController of the testObjectProvider
 */
export const getContainers = async (sharedObjectFactory) => {
  const objectID = 'sharedObject'
  const runtimeFactory = (_) => new TestContainerRuntimeFactory('@fluid-example/test-dataStore', new TestFluidObjectFactory([[objectID, sharedObjectFactory]]), { generateSummaries: false })
  let testObjectProvider
  if (USE_TINYLICIOUS) {
    // Use Tinylicious server
    testObjectProvider = new TestObjectProvider(Loader, new TinyliciousTestDriver(), runtimeFactory)
  } else {
    // Use local server
    testObjectProvider = new TestObjectProvider(Loader, new LocalServerTestDriver(), runtimeFactory)
  }
  const registry = [[objectID, sharedObjectFactory]]
  const testContainerConfig = {
    fluidDataObjectType: 0,
    registry,
    generateSummaries: false
  }

  const container1 = await testObjectProvider.makeTestContainer(testContainerConfig)
  const fluidObject = await requestFluidObject(container1, 'default')
  const sharedObject1 = await fluidObject.getSharedObject(objectID)

  const container2 = await testObjectProvider.loadTestContainer(testContainerConfig)
  container2.deltaManager.setMaxListeners(1000)
  const dataObject2 = await requestFluidObject(container2, 'default')
  const sharedObject2 = await dataObject2.getSharedObject(objectID)
  containers.push(container1, container2)
  testObjectProvider.opProcessingController.addDeltaManagers(container1.deltaManager, container2.deltaManager)

  return [sharedObject1, sharedObject2, testObjectProvider]
}