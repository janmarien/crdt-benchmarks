
import * as Y from 'yjs'
import { setBenchmarkResult, gen, N, benchmarkTime, cpy, disableAutomergeBenchmarks, disableYjsBenchmarks, disablePeersCrdtsBenchmarks, logMemoryUsed, getMemUsed, deltaInsertHelper, deltaDeleteHelper, getContainers, disableFluidBenchmarks, calculateContainerSize } from './utils.js'
import * as prng from 'lib0/prng.js'
import * as math from 'lib0/math.js'
import * as t from 'lib0/testing.js'
import Automerge from 'automerge'
import DeltaCRDT from 'delta-crdts'
import deltaCodec from 'delta-crdts-msgpack-codec'
import { SharedString } from '@fluidframework/sequence'
const DeltaRGA = DeltaCRDT('rga')

const initText = prng.word(gen, 100, 100)

const benchmarkYjs = async (id, changeDoc1, changeDoc2, check) => {
  const startHeapUsed = getMemUsed()

  if (disableYjsBenchmarks) {
    setBenchmarkResult('yjs', id, 'skipping')
    return
  }

  const doc1 = new Y.Doc()
  const doc2 = new Y.Doc()
  /**
   * @type {any}
   */
  let update1To2
  /**
   * @type {any}
   */
  let update2To1
  doc1.on('updateV2', (update, origin) => {
    if (origin !== doc2) { // ignore if this message was received from doc2
      update1To2 = update
    }
  })
  doc2.on('updateV2', (update, origin) => {
    if (origin !== doc1) {
      update2To1 = update
    }
  })
  doc1.getText('text').insert(0, initText)
  Y.applyUpdateV2(doc2, update1To2)
  await benchmarkTime('yjs', `${id} (time)`, () => {
    doc1.transact(() => {
      changeDoc1(doc1)
    })
    doc2.transact(() => {
      changeDoc2(doc2)
    })
    Y.applyUpdateV2(doc1, update2To1, doc2)
    Y.applyUpdateV2(doc2, update1To2, doc1)
  })
  check(doc1, doc2)
  setBenchmarkResult('yjs', `${id} (updateSize)`, `${math.round(update1To2.byteLength + update2To1.byteLength)} bytes`)
  const encodedState = Y.encodeStateAsUpdateV2(doc1)
  const documentSize = encodedState.byteLength
  setBenchmarkResult('yjs', `${id} (docSize)`, `${documentSize} bytes`)
  await benchmarkTime('yjs', `${id} (parseTime)`, () => {
    const doc = new Y.Doc()
    Y.applyUpdateV2(doc, encodedState)
    logMemoryUsed('yjs', id, startHeapUsed)
  })
}

const benchmarkDeltaCrdts = async (id, changeDoc1, changeDoc2, check) => {
  const startHeapUsed = getMemUsed()

  if (disablePeersCrdtsBenchmarks) {
    setBenchmarkResult('delta-crdts', id, 'skipping')
    return
  }

  const doc1 = DeltaRGA('1')
  const doc2 = DeltaRGA('2')
  /**
   * @type {any}
   */
  let update1to2
  /**
   * @type {any}
   */
  let update2to1

  // init the document
  deltaInsertHelper(doc1, 0, initText).map(deltaCodec.encode).forEach(delta => {
    // apply all changes to doc2
    doc2.apply(deltaCodec.decode(delta))
  })

  await benchmarkTime('delta-crdts', `${id} (time)`, () => {
    update1to2 = changeDoc1(doc1).map(deltaCodec.encode)
    update2to1 = changeDoc2(doc2).map(deltaCodec.encode)
    // need to sync again because delta-crdts don't converge otherwise.. (see B2.4)
    update1to2.forEach(d => doc2.apply(deltaCodec.decode(d)))
    update2to1.forEach(d => doc1.apply(deltaCodec.decode(d)))
    doc2.apply(doc1.state())
    doc1.apply(doc2.state())
  })
  check(doc1, doc2)
  const updateLen1 = update1to2.map(u => u.byteLength).reduce((a, b) => a + b)
  const updateLen2 = update2to1.map(u => u.byteLength).reduce((a, b) => a + b)
  setBenchmarkResult('delta-crdts', `${id} (updateSize)`, `${math.round(updateLen1 + updateLen2)} bytes`)
  const encodedState = deltaCodec.encode(doc1.state())
  const documentSize = encodedState.byteLength
  setBenchmarkResult('delta-crdts', `${id} (docSize)`, `${documentSize} bytes`)
  await benchmarkTime('delta-crdts', `${id} (parseTime)`, () => {
    const doc = DeltaRGA('3')
    doc.apply(deltaCodec.decode(encodedState))
    logMemoryUsed('delta-crdts', id, startHeapUsed)
  })
}

const benchmarkAutomerge = async (id, changeDoc1, changeDoc2, check) => {
  const startHeapUsed = getMemUsed()
  if (N > 10000 || disableAutomergeBenchmarks) {
    setBenchmarkResult('automerge', id, 'skipping')
    return
  }
  const emptyDoc = Automerge.init()
  let doc1 = Automerge.change(emptyDoc, doc => {
    doc.text = new Automerge.Text()
    doc.text.insertAt(0, ...initText)
  })
  let doc2 = Automerge.applyChanges(Automerge.init(), cpy(Automerge.getChanges(emptyDoc, doc1)))
  let updateSize = 0
  await benchmarkTime('automerge', `${id} (time)`, () => {
    const updatedDoc1 = Automerge.change(doc1, changeDoc1)
    const updatedDoc2 = Automerge.change(doc2, changeDoc2)
    const update2 = JSON.stringify(Automerge.getChanges(doc1, updatedDoc1))
    const update1 = JSON.stringify(Automerge.getChanges(doc2, updatedDoc2))
    updateSize += update1.length + update2.length
    doc2 = Automerge.applyChanges(updatedDoc2, JSON.parse(update2))
    doc1 = Automerge.applyChanges(updatedDoc1, JSON.parse(update1))
  })
  check(doc1, doc2)
  setBenchmarkResult('automerge', `${id} (updateSize)`, `${math.round(updateSize)} bytes`)
  const encodedState = Automerge.save(doc1)
  const documentSize = encodedState.length
  setBenchmarkResult('automerge', `${id} (docSize)`, `${documentSize} bytes`)
  await benchmarkTime('automerge', `${id} (parseTime)`, () => {
    Automerge.load(encodedState)
  })
  logMemoryUsed('automerge', id, startHeapUsed)
}

/**
 * 
 * @param {String} id name of the benchmark e.g. "[B1.1] Description"
 * @param {function(SharedString):void} changeFunction1 
 * @param {function(SharedString):void} changeFunction2 
 * @param {function(SharedString, SharedString):void} check 
 */
const benchmarkFluid = async (id, changeFunction1, changeFunction2, check) => {

  const startHeapUsed = getMemUsed()
  if (disableFluidBenchmarks) {
    setBenchmarkResult('fluid', id, 'skipping')
  }
  const containersAndOpc = await getContainers(SharedString.getFactory())
  const object1 = containersAndOpc[0]
  const object2 = containersAndOpc[1]
  const testObjectProvider = containersAndOpc[2]
  const parseFunction = containersAndOpc[3]
  object1.insertText(0, initText)
  await testObjectProvider.ensureSynchronized();
  let updateSize = 0
  object1.on("op", op => {
    if (op.clientId !== object1.client.longClientId)
    updateSize += JSON.stringify(op).length
  })
  object2.on("op", op => {
    if (op.clientId !== object2.client.longClientId)
    updateSize += JSON.stringify(op).length
  })

  await benchmarkTime('fluid', `${id} (time)`, async () => {
    changeFunction1(object1)
    changeFunction2(object2)
    await testObjectProvider.ensureSynchronized();
  })
  check(object1, object2)
  setBenchmarkResult('fluid', `${id} (updateSize)`, `${math.round(updateSize)} bytes`)
  const docSize = await calculateContainerSize(object1.runtime.dataStoreContext._containerRuntime)
  setBenchmarkResult('fluid', `${id} (docSize)`, `${docSize} bytes`)
  //logMemoryUsed('fluid', id, startHeapUsed)
  await benchmarkTime('fluid', `${id} (parseTime)`, async () => {
    await parseFunction()
    //check(object1, object3)
    logMemoryUsed('fluid', id, startHeapUsed)
  })
}

export async function runBenchmarksB2() {
  {
    const benchmarkName = '[B2.1] Concurrently insert string of length N at index 0'
    const string1 = prng.word(gen, N, N)
    const string2 = prng.word(gen, N, N)
    await benchmarkYjs(
      benchmarkName,
      doc1 => { doc1.getText('text').insert(0, string1) },
      doc2 => { doc2.getText('text').insert(0, string2) },
      (doc1, doc2) => {
        t.assert(doc1.getText('text').toString() === doc2.getText('text').toString())
        t.assert(doc1.getText('text').toString().length === N * 2 + 100)
      }
    )
    await benchmarkDeltaCrdts(
      benchmarkName,
      doc1 => deltaInsertHelper(doc1, 0, string1),
      doc2 => deltaInsertHelper(doc2, 0, string2),
      (doc1, doc2) => {
        t.assert(doc1.value().join('') === doc2.value().join(''))
        t.assert(doc1.value().join('').length === N * 2 + 100)
      }
    )
    await benchmarkAutomerge(
      benchmarkName,
      doc1 => { doc1.text.insertAt(0, ...string1) },
      doc2 => { doc2.text.insertAt(0, ...string2) },
      (doc1, doc2) => {
        t.assert(doc1.text.join('') === doc2.text.join(''))
        t.assert(doc1.text.join('').length === N * 2 + 100)
      }
    )
    await benchmarkFluid(
      benchmarkName,
      sharedString1 => { sharedString1.insertText(0, string1) },
      sharedString2 => { sharedString2.insertText(0, string2) },
      (sharedString1, sharedString2) => {
        t.assert(sharedString1.getText() == sharedString2.getText())
        t.assert(sharedString2.getLength() === N * 2 + 100)
      }
    )
  }

  {
    const benchmarkName = '[B2.2] Concurrently insert N characters at random positions'
    const genInput = () => {
      let str = initText
      const input = []
      for (let i = 0; i < N; i++) {
        const index = prng.uint32(gen, 0, str.length)
        const insert = prng.word(gen, 1, 1)
        str = str.slice(0, index) + insert + str.slice(index)
        input.push({ index, insert })
      }
      return input
    }
    const input1 = genInput()
    const input2 = genInput()
    await benchmarkYjs(
      benchmarkName,
      doc1 => {
        const ytext = doc1.getText('text')
        input1.forEach(({ index, insert }) => { ytext.insert(index, insert) })
      },
      doc2 => {
        const ytext = doc2.getText('text')
        input2.forEach(({ index, insert }) => { ytext.insert(index, insert) })
      },
      (doc1, doc2) => {
        t.assert(doc1.getText('text').toString() === doc2.getText('text').toString())
        t.assert(doc1.getText('text').toString().length === N * 2 + 100)
      }
    )
    await benchmarkDeltaCrdts(
      benchmarkName,
      doc1 => input1.map(({ index, insert }) => deltaInsertHelper(doc1, index, insert)).flat(1),
      doc2 => input2.map(({ index, insert }) => deltaInsertHelper(doc2, index, insert)).flat(1),
      (doc1, doc2) => {
        t.assert(doc1.value().join('') === doc2.value().join(''))
        t.assert(doc1.value().join('').length === N * 2 + 100)
      }
    )
    await benchmarkAutomerge(
      benchmarkName,
      doc1 => {
        input1.forEach(({ index, insert }) => { doc1.text.insertAt(index, ...insert) })
      },
      doc2 => {
        input2.forEach(({ index, insert }) => { doc2.text.insertAt(0, ...insert) })
      },
      (doc1, doc2) => {
        t.assert(doc1.text.join('') === doc2.text.join(''))
        t.assert(doc1.text.join('').length === N * 2 + 100)
      }
    )
    await benchmarkFluid(
      benchmarkName,
      sharedString1 => {
        input1.forEach(({ index, insert }) => { sharedString1.insertText(index, insert) })
      },
      sharedString2 => {
        input2.forEach(({ index, insert }) => { sharedString2.insertText(0, insert) })
      },
      (sharedString1, sharedString2) => {
        t.assert(sharedString1.getText() == sharedString2.getText())
        t.assert(sharedString2.getLength() === N * 2 + 100)
      }
    )
  }

  {
    const benchmarkName = '[B2.3] Concurrently insert N words at random positions'
    const genInput = () => {
      let str = initText
      const input = []
      for (let i = 0; i < N; i++) {
        const index = prng.uint32(gen, 0, str.length)
        const insert = prng.word(gen, 3, 9)
        str = str.slice(0, index) + insert + str.slice(index)
        input.push({ index, insert })
      }
      return input
    }
    const input1 = genInput()
    const input2 = genInput()
    await benchmarkYjs(
      benchmarkName,
      doc1 => {
        const ytext = doc1.getText('text')
        input1.forEach(({ index, insert }) => { ytext.insert(index, insert) })
      },
      doc2 => {
        const ytext = doc2.getText('text')
        input2.forEach(({ index, insert }) => { ytext.insert(index, insert) })
      },
      (doc1, doc2) => {
        t.assert(doc1.getText('text').toString() === doc2.getText('text').toString())
      }
    )
    await benchmarkDeltaCrdts(
      benchmarkName,
      doc1 => input1.map(({ index, insert }) => deltaInsertHelper(doc1, index, insert)).flat(1),
      doc2 => input2.map(({ index, insert }) => deltaInsertHelper(doc2, index, insert)).flat(1),
      (doc1, doc2) => {
        t.assert(doc1.value().join('') === doc2.value().join(''))
      }
    )
    await benchmarkAutomerge(
      benchmarkName,
      doc1 => {
        input1.forEach(({ index, insert }) => { doc1.text.insertAt(index, ...insert) })
      },
      doc2 => {
        input2.forEach(({ index, insert }) => { doc2.text.insertAt(0, ...insert) })
      },
      (doc1, doc2) => {
        t.assert(doc1.text.join('') === doc2.text.join(''))
      }
    )
    await benchmarkFluid(
      benchmarkName,
      sharedString1 => {
        input1.forEach(({ index, insert }) => { sharedString1.insertText(index, insert) })
      },
      sharedString2 => {
        input2.forEach(({ index, insert }) => { sharedString2.insertText(0, insert) })
      },
      (sharedString1, sharedString2) => {
        t.assert(sharedString1.getText() == sharedString2.getText())
      }
    )
  }

  {
    const benchmarkName = '[B2.4] Concurrently insert & delete'
    const genInput = () => {
      let str = initText
      const input = []
      for (let i = 0; i < N; i++) {
        const index = prng.uint32(gen, 0, str.length)
        const insert = prng.word(gen, 3, 9)
        str = str.slice(0, index) + insert + str.slice(index)
        input.push({ index, insert })
        if (str.length === index || prng.bool(gen)) {
          const insert = prng.word(gen, 2, 10)
          str = str.slice(0, index) + insert + str.slice(index)
          input.push({ index, insert })
        } else {
          const deleteCount = prng.uint32(gen, 1, math.min(9, str.length - index))
          str = str.slice(0, index) + str.slice(index + deleteCount)
          input.push({ index, deleteCount })
        }
      }
      return input
    }
    const input1 = genInput()
    const input2 = genInput()
    await benchmarkYjs(
      benchmarkName,
      doc1 => {
        const ytext = doc1.getText('text')
        input1.forEach(({ index, insert, deleteCount }) => {
          if (insert !== undefined) {
            ytext.insert(index, insert)
          } else {
            ytext.delete(index, deleteCount)
          }
        })
      },
      doc2 => {
        const ytext = doc2.getText('text')
        input2.forEach(({ index, insert, deleteCount }) => {
          if (insert !== undefined) {
            ytext.insert(index, insert)
          } else {
            ytext.delete(index, deleteCount)
          }
        })
      },
      (doc1, doc2) => {
        t.assert(doc1.getText('text').toString() === doc2.getText('text').toString())
      }
    )
    await benchmarkDeltaCrdts(
      benchmarkName,
      doc1 => input1.map(({ index, insert, deleteCount }) => {
        if (insert !== undefined) {
          return deltaInsertHelper(doc1, index, insert).flat(1)
        } else if (deleteCount !== undefined) {
          return deltaDeleteHelper(doc1, index, deleteCount).flat(1)
        } else {
          throw new Error('unexpected delete type')
        }
      }),
      doc2 => input2.map(({ index, insert, deleteCount }) => {
        if (insert !== undefined) {
          return deltaInsertHelper(doc2, index, insert).flat(1)
        } else if (deleteCount !== undefined) {
          return deltaDeleteHelper(doc2, index, deleteCount).flat(1)
        } else {
          throw new Error('unexpected delete type')
        }
      }),
      (doc1, doc2) => {
        t.assert(doc1.value().join('') === doc2.value().join(''))
      }
    )
    await benchmarkAutomerge(
      benchmarkName,
      doc1 => {
        input1.forEach(({ index, insert, deleteCount }) => {
          if (insert !== undefined) {
            doc1.text.insertAt(index, ...insert)
          } else {
            doc1.text.deleteAt(index, deleteCount)
          }
        })
      },
      doc2 => {
        input2.forEach(({ index, insert, deleteCount }) => {
          if (insert !== undefined) {
            doc2.text.insertAt(index, ...insert)
          } else {
            doc2.text.deleteAt(index, deleteCount)
          }
        })
      },
      (doc1, doc2) => {
        t.assert(doc1.text.join('') === doc2.text.join(''))
      }
    )
    await benchmarkFluid(
      benchmarkName,
      sharedString1 => {
        input1.forEach(({ index, insert, deleteCount }) => {
          if (insert !== undefined) {
            sharedString1.insertText(index, insert)
          } else {
            sharedString1.removeText(index, index + deleteCount)
          }
        })
      },
      sharedString2 => {
        input1.forEach(({ index, insert, deleteCount }) => {
          if (insert !== undefined) {
            sharedString2.insertText(index, insert)
          } else {
            sharedString2.removeText(index, index + deleteCount)
          }
        })
      },
      (sharedString1, sharedString2) => {
        t.assert(sharedString1.getText() == sharedString2.getText())
      }
    )
  }
}
