
import * as Y from 'yjs'
import { setBenchmarkResult, benchmarkTime, N, disableAutomergeBenchmarks, disableYjsBenchmarks, disablePeersCrdtsBenchmarks, logMemoryUsed, getMemUsed, disableFluidBenchmarks, getNContainers, multiN, calculateContainerSize } from './utils.js'
import * as t from 'lib0/testing.js'
import * as math from 'lib0/math.js'
import Automerge, { change } from 'automerge'
import DeltaCRDT from 'delta-crdts'
import deltaCodec from 'delta-crdts-msgpack-codec'
import { SharedObjectSequence } from '@fluidframework/sequence'
import { SharedMap } from '@fluidframework/map'
const DeltaRGA = DeltaCRDT('rga')

console.log('# Clients =', multiN)

const benchmarkYjs = async (id, changeDoc, check) => {
  const startHeapUsed = getMemUsed()

  if (disableYjsBenchmarks) {
    setBenchmarkResult('yjs', id, 'skipping')
    return
  }

  const docs = []
  const updates = []
  for (let i = 0; i < multiN; i++) {
    const doc = new Y.Doc()
    doc.on('updateV2', (update, origin) => {
      if (origin !== 'remote') {
        updates.push(update)
      }
    })
    docs.push(doc)
  }
  for (let i = 0; i < docs.length; i++) {
    changeDoc(docs[i], i)
  }
  // sync client 0 for reference
  for (let i = 0; i < updates.length; i++) {
    Y.applyUpdateV2(docs[0], updates[i], 'remote')
  }
  await benchmarkTime('yjs', `${id} (time)`, () => {
    for (let i = 0; i < updates.length; i++) {
      Y.applyUpdateV2(docs[1], updates[i], 'remote')
    }
  })
  t.assert(updates.length === multiN)
  check(docs.slice(0, 2))
  setBenchmarkResult('yjs', `${id} (updateSize)`, `${updates.reduce((len, update) => len + update.byteLength, 0)} bytes`)
  const encodedState = Y.encodeStateAsUpdateV2(docs[0])
  const documentSize = encodedState.byteLength
  setBenchmarkResult('yjs', `${id} (docSize)`, `${documentSize} bytes`)
  await benchmarkTime('yjs', `${id} (parseTime)`, () => {
    const doc = new Y.Doc()
    Y.applyUpdateV2(doc, encodedState)
    logMemoryUsed('yjs', id, startHeapUsed)
  })
}

const benchmarkDeltaCrdts = async (id, changeDoc, check) => {
  const startHeapUsed = getMemUsed()

  if (disablePeersCrdtsBenchmarks) {
    setBenchmarkResult('delta-crdts', id, 'skipping')
    return
  }

  const docs = []
  const updates = []
  for (let i = 0; i < multiN; i++) {
    docs.push(DeltaRGA(i + ''))
  }

  for (let i = 0; i < docs.length; i++) {
    updates.push(...changeDoc(docs[i], i).map(deltaCodec.encode))
  }
  // sync client 0 for reference
  updates.forEach(update => {
    docs[0].apply(deltaCodec.decode(update))
  })
  await benchmarkTime('delta-crdts', `${id} (time)`, () => {
    updates.forEach(update => {
      docs[1].apply(deltaCodec.decode(update))
    })
  })

  t.assert(updates.length >= multiN)
  check(docs.slice(0, 2))
  setBenchmarkResult('delta-crdts', `${id} (updateSize)`, `${updates.reduce((len, update) => len + update.byteLength, 0)} bytes`)
  const encodedState = deltaCodec.encode(docs[0].state())
  const documentSize = encodedState.byteLength
  setBenchmarkResult('delta-crdts', `${id} (docSize)`, `${documentSize} bytes`)
  await benchmarkTime('delta-crdts', `${id} (parseTime)`, () => {
    const doc = DeltaRGA('fresh')
    updates.forEach(update => {
      doc.apply(deltaCodec.decode(update))
    })
    logMemoryUsed('delta-crdts', id, startHeapUsed)
  })
}

const benchmarkAutomerge = async (id, init, changeDoc, check) => {
  const startHeapUsed = getMemUsed()
  if (N > 10000 || disableAutomergeBenchmarks) {
    setBenchmarkResult('automerge', id, 'skipping')
    return
  }
  const docs = []
  for (let i = 0; i < multiN; i++) {
    docs.push(Automerge.init())
  }
  const initDoc = Automerge.change(docs[0], init)
  const initUpdate = JSON.stringify(Automerge.getChanges(docs[0], initDoc))
  for (let i = 0; i < docs.length; i++) {
    docs[i] = Automerge.applyChanges(docs[i], JSON.parse(initUpdate))
  }
  const updates = []
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i]
    const updatedDoc = Automerge.change(doc, d => { changeDoc(d, i) })
    const update = JSON.stringify(Automerge.getChanges(doc, updatedDoc))
    updates.push(update)
    docs[i] = updatedDoc
  }
  for (let i = 0; i < updates.length; i++) {
    docs[0] = Automerge.applyChanges(docs[0], JSON.parse(updates[i]))
  }
  await benchmarkTime('automerge', `${id} (time)`, () => {
    for (let i = 0; i < updates.length; i++) {
      docs[1] = Automerge.applyChanges(docs[1], JSON.parse(updates[i]))
    }
  })
  check(docs.slice(0, 2))
  setBenchmarkResult('automerge', `${id} (updateSize)`, `${updates.reduce((len, update) => len + update.length, 0)} bytes`)
  const encodedState = Automerge.save(docs[0])
  const documentSize = encodedState.length
  setBenchmarkResult('automerge', `${id} (docSize)`, `${documentSize} bytes`)
  await benchmarkTime('automerge', `${id} (parseTime)`, () => {
    // @ts-ignore
    const doc = Automerge.load(encodedState) // eslint-disable-line
    logMemoryUsed('automerge', id, startHeapUsed)
  })
}


const benchmarkFluid = async (id, changeFunction, check, objectFactory, disable = false) => {
  if (disable) {
    setBenchmarkResult('fluid', id, 'skipping')
    return
  }
  const startHeapUsed = getMemUsed()
  if (disableFluidBenchmarks) {
    setBenchmarkResult('fluid', id, 'skipping')
  }
  const containersAndOpc = await getNContainers(objectFactory)
  const objects = containersAndOpc[0]
  const testObjectProvider = containersAndOpc[1]
  const parseFunction = containersAndOpc[2]

  let updates = []
  objects.forEach(object => {
    object.on("op", (op, local) => {
      if (local) {
        updates.push(op)
      }
    })
  });
  await benchmarkTime('fluid', `${id} (time)`, async () => {
    objects.forEach((object, i) => {
      changeFunction(object, i)
    });
    await testObjectProvider.ensureSynchronized();
  })
  check(objects.slice(0, 2))
  console.log(updates.length)

  setBenchmarkResult('fluid', `${id} (updateSize)`, `${updates.reduce((len, update) => len + JSON.stringify(update).length, 0)} bytes`)
  const docSize = await calculateContainerSize(objects[1].runtime.dataStoreContext._containerRuntime)

  setBenchmarkResult('fluid', `${id} (docSize)`, `${docSize} bytes`)
  await benchmarkTime('fluid', `${id} (parseTime)`, async () => {
    await parseFunction()
    logMemoryUsed('fluid', id, startHeapUsed)
  })
  testObjectProvider.reset()
}


export async function runBenchmarksB3() {
  {
    const benchmarkName = `[B3.1] ${multiN} clients concurrently set number in Map`
    await benchmarkYjs(
      benchmarkName,
      (doc, i) => doc.getMap('map').set('v', i),
      docs => {
        const v = docs[0].getMap('map').get('v')
        docs.forEach(doc => {
          t.assert(doc.getMap('map').get('v') === v)
        })
      }
    )
    await benchmarkAutomerge(
      benchmarkName,
      doc => { },
      (doc, i) => { doc.v = i },
      docs => {
        const v = docs[0].v
        docs.forEach(doc => {
          t.assert(doc.v === v)
        })
      }
    )
    await benchmarkFluid(
      benchmarkName,
      (map, i) => { map.set('v', i) },
      maps => {
        const v = maps[0].get('v')
        maps.forEach(map => {
          t.assert(map.get('v') === v)
        });
      },
      SharedMap.getFactory(),
    )
  }

  {
    const benchmarkName = `[B3.2] ${multiN} clients concurrently set Object in Map`
    // each client sets a user data object { name: id, address: 'here' }
    await benchmarkYjs(
      benchmarkName,
      (doc, i) => {
        const v = new Y.Map()
        v.set('name', i.toString())
        v.set('address', 'here')
        doc.getMap('map').set('v', v)
      },
      docs => {
        const v = docs[0].getMap('map').get('v').get('name')
        docs.forEach(doc => {
          t.assert(doc.getMap('map').get('v').get('name') === v)
        })
      }
    )
    await benchmarkAutomerge(
      benchmarkName,
      doc => { },
      (doc, i) => { doc.v = { name: i.toString(), address: 'here' } },
      docs => {
        const v = docs[0].v.name
        docs.forEach(doc => {
          t.assert(doc.v.name === v)
        })
      }
    )
    await benchmarkFluid(
      benchmarkName,
      (map, i) => {
        const v = { 'name': i.toString(), 'address': 'here' }
        map.set('v', v)
      },
      maps => {
        const v = maps[0].get('v').name
        maps.forEach(map => {
          t.assert(map.get('v').name === v)
        })
      },
      SharedMap.getFactory(),
    )
  }

  {
    const benchmarkName = `[B3.3] ${multiN} clients concurrently set String in Map`
    await benchmarkYjs(
      benchmarkName,
      (doc, i) => {
        doc.getMap('map').set('v', i.toString().repeat(multiN))
      },
      docs => {
        const v = docs[0].getMap('map').get('v')
        docs.forEach(doc => {
          t.assert(doc.getMap('map').get('v') === v)
        })
      }
    )
    await benchmarkAutomerge(
      benchmarkName,
      doc => { },
      (doc, i) => { doc.v = i.toString().repeat(multiN) },
      docs => {
        const v = docs[0].v
        docs.forEach(doc => {
          t.assert(doc.v === v)
        })
      }
    )
    await benchmarkFluid(
      benchmarkName,
      (map, i) => { map.set('v', i.toString().repeat(multiN)) },
      maps => {
        const v = maps[0].get('v')
        maps.forEach(map => {
          t.assert(map.get('v') === v)
        })
      },
      SharedMap.getFactory(),
    )
  }

  {
    const benchmarkName = `[B3.4] ${multiN} clients concurrently insert text in Array`
    await benchmarkYjs(
      benchmarkName,
      (doc, i) => {
        doc.getArray('array').insert(0, [i.toString()])
      },
      docs => {
        const len = docs[0].getArray('array').length
        docs.forEach(doc => {
          t.assert(doc.getArray('array').length === len)
        })
      }
    )
    await benchmarkDeltaCrdts(
      benchmarkName,
      (doc, i) => {
        return [doc.insertAt(0, i.toString())]
      },
      docs => {
        const len = docs[0].value().length
        docs.forEach(doc => {
          t.assert(doc.value().length === len)
        })
        t.assert(len === multiN)
      }
    )
    await benchmarkAutomerge(
      benchmarkName,
      doc => { doc.array = [] },
      (doc, i) => { doc.array.insertAt(0, i.toString()) },
      docs => {
        const len = docs[0].array.length
        docs.forEach(doc => {
          t.assert(doc.array.length === len)
        })
      }
    )
    await benchmarkFluid(
      benchmarkName,
      (array, i) => { array.insert(0, [i.toString()]) },
      arrays => {
        const len = arrays[0].length
        arrays.forEach(array => {
          t.assert(array.length === len)
        })
      },
      SharedObjectSequence.getFactory(),
    )
  }
}
