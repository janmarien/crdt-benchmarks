import * as Y from 'yjs'
import { setBenchmarkResult, N, benchmarkTime, disableAutomergeBenchmarks, disablePeersCrdtsBenchmarks, disableYjsBenchmarks, logMemoryUsed, getMemUsed, tryGc, getContainer, calculateContainerSize, disableFluidBenchmarks } from './utils.js'
import * as math from 'lib0/math.js'
import * as t from 'lib0/testing.js'
// @ts-ignore
import { edits, finalText } from './b4-editing-trace.js'
import Automerge, { change } from 'automerge'
import DeltaCRDT from 'delta-crdts'
import deltaCodec from 'delta-crdts-msgpack-codec'
import { SharedString } from '@fluidframework/sequence'

console.log(edits.length)
const DeltaRGA = DeltaCRDT('rga')

const benchmarkYjs = async (id, inputData, changeFunction, check) => {
  if (disableYjsBenchmarks) {
    setBenchmarkResult('yjs', id, 'skipping')
    return
  }

  let encodedState = /** @type {any} */ (null)
  await (async () => {
    // We scope the creation of doc1 so we can gc it before we parse it again.
    const doc1 = new Y.Doc()
    let updateSize = 0
    doc1.on('updateV2', update => {
      updateSize += update.byteLength
    })
    await benchmarkTime('yjs', `${id} (time)`, () => {
      for (let i = 0; i < inputData.length; i++) {
        changeFunction(doc1, inputData[i], i)
      }
    })
    check(doc1)
    setBenchmarkResult('yjs', `${id} (avgUpdateSize)`, `${math.round(updateSize / inputData.length)} bytes`)
    /**
     * @type {any}
     */
    await benchmarkTime('yjs', `${id} (encodeTime)`, () => {
      encodedState = Y.encodeStateAsUpdateV2(doc1)
    })
  })()
  const documentSize = encodedState.byteLength
  setBenchmarkResult('yjs', `${id} (docSize)`, `${documentSize} bytes`)
  tryGc()
  await (async () => {
    const startHeapUsed = getMemUsed()
    // @ts-ignore we only store doc so it is not garbage collected
    let doc = null // eslint-disable-line
    await benchmarkTime('yjs', `${id} (parseTime)`, () => {
      doc = new Y.Doc()
      Y.applyUpdateV2(doc, encodedState)
      logMemoryUsed('yjs', id, startHeapUsed)
    })
  })()
}

const benchmarkDeltaCRDTs = async (id, inputData, changeFunction, check) => {
  if (disablePeersCrdtsBenchmarks) {
    setBenchmarkResult('delta-crdts', id, 'skipping')
    return
  }
  let encodedState = /** @type {any} */ (null)
  await (async () => {
    const doc1 = DeltaRGA('1')
    let updateSize = 0
    let lastStepTime = Date.now()
    const logSteps = Math.round(inputData.length / 100)

    await benchmarkTime('delta-crdts', `${id} (time)`, () => {
      for (let i = 0; i < inputData.length; i++) {
        if (i % logSteps === 0) {
          const now = Date.now()
          console.log(`Finished ${math.round(100 * i / inputData.length)}% (last log message ${now - lastStepTime} ms ago)`)
          lastStepTime = now
        }
        const deltas = changeFunction(doc1, inputData[i], i)
        updateSize += deltas.reduce((size, update) => size + update.byteLength, 0)
      }
    })
    check(doc1)

    setBenchmarkResult('delta-crdts', `${id} (avgUpdateSize)`, `${math.round(updateSize / inputData.length)} bytes`)
    /**
     * @type {any}
     */
    await benchmarkTime('delta-crdts', `${id} (encodeTime)`, () => {
      encodedState = deltaCodec.encode(doc1.state())
    })
  })()
  const documentSize = encodedState.byteLength
  setBenchmarkResult('delta-crdts', `${id} (docSize)`, `${documentSize} bytes`)
  tryGc()
  await (async () => {
    const startHeapUsed = getMemUsed()
    // @ts-ignore we only store doc so it is not garbage collected
    let doc = null // eslint-disable-line
    await benchmarkTime('delta-crdts', `${id} (parseTime)`, () => {
      doc = DeltaRGA('2')
      doc.apply(deltaCodec.decode(encodedState))
      logMemoryUsed('delta-crdts', id, startHeapUsed)
    })
    check(doc)
  })()
}

const benchmarkAutomerge = async (id, init, inputData, changeFunction, check) => {
  /**
   * @type {any}
   */
  let encodedState
  if (N > 10000 || disableAutomergeBenchmarks) {
    setBenchmarkResult('automerge', id, 'skipping')
    return
  }
  await (async () => {
    // We scope the creation of the first doc so we can gc it before we continue parting it.
    // Note: Automerge 0.10.1 uses so much memory that there is only enough memory for a single doc
    // containing all the edits from b4.
    const emptyDoc = Automerge.init()
    let doc1 = Automerge.change(emptyDoc, init)
    let updateSize = 0
    await benchmarkTime('automerge', `${id} (time)`, () => {
      for (let i = 0; i < inputData.length; i++) {
        const updatedDoc = Automerge.change(doc1, doc => {
          changeFunction(doc, inputData[i], i)
        })
        const update = JSON.stringify(Automerge.getChanges(doc1, updatedDoc))
        updateSize += update.length
        doc1 = updatedDoc
      }
    })
    check(doc1)
    setBenchmarkResult('automerge', `${id} (avgUpdateSize)`, `${math.round(updateSize / inputData.length)} bytes`)
    await benchmarkTime('automerge', `${id} (encodeTime)`, () => {
      encodedState = Automerge.save(doc1)
    })
    const documentSize = encodedState.length
    setBenchmarkResult('automerge', `${id} (docSize)`, `${documentSize} bytes`)
  })()
  await (async () => {
    const startHeapUsed = getMemUsed()
    // @ts-ignore We only keep doc so the document is not garbage collected
    let doc = null // eslint-disable-line
    await benchmarkTime('automerge', `${id} (parseTime)`, () => {
      doc = Automerge.load(encodedState)
      logMemoryUsed('automerge', id, startHeapUsed)
    })
  })()
}
const benchmarkFluid = async (id, inputData, changeFunction, check) => {
  const startHeapUsed = getMemUsed()
  if (disableFluidBenchmarks) {
    setBenchmarkResult('fluid', id, 'skipping')
  }
  const objectAndOpc = await getContainer(SharedString.getFactory())
  const sharedObject = objectAndOpc[0]
  const testObjectProvider = objectAndOpc[1]
  const parseFunction = objectAndOpc[2]
  let updateSize = 0
  const logSteps = Math.round(inputData.length / 100)
  sharedObject.on("op", op => {
    updateSize += JSON.stringify(op).length
  })
  await benchmarkTime('fluid', `${id} (time)`, async () => {
    for (let i = 0; i < inputData.length; i++) {
      changeFunction(sharedObject, inputData[i])
      if (i % logSteps === 0 && i > 0) {
        await testObjectProvider.ensureSynchronized();
        console.log(`Finished ${math.round(100 * i / inputData.length)}%`)
      }
    }
    await testObjectProvider.ensureSynchronized();
  })
  check(sharedObject)
  setBenchmarkResult('fluid', `${id} (updateSize)`, `${math.round(updateSize)} bytes`)
  const docSize = await calculateContainerSize(sharedObject.runtime.dataStoreContext._containerRuntime)
  setBenchmarkResult('fluid', `${id} (docSize)`, `${docSize} bytes`)
  await benchmarkTime('fluid', `${id} (parseTime)`, async () => {
    await parseFunction()
    logMemoryUsed('fluid', id, startHeapUsed)
  })
}

export async function runBenchmarksB4() {
  {
    const benchmarkName = '[B4] Apply real-world editing dataset'
    await benchmarkYjs(
      benchmarkName,
      edits,
      (doc, edit) => {
        const ytext = doc.getText('text')
        ytext.delete(edit[0], edit[1])
        if (edit[2]) {
          ytext.insert(edit[0], edit[2])
        }
      },
      doc1 => {
        t.assert(doc1.getText('text').toString() === finalText)
      }
    )
    await benchmarkDeltaCRDTs(
      benchmarkName,
      edits,
      (doc, edit) => {
        const updates = []
        if (edit[1] > 0) {
          updates.push(deltaCodec.encode(doc.removeAt(edit[0], edit[1])))
        }
        if (edit[2]) {
          updates.push(deltaCodec.encode(doc.insertAt(edit[0], edit[2])))
        }
        return updates
      },
      doc1 => {
        try {
          t.assert(doc1.value().join('') === finalText)
        } catch (e) {
          // we don't expect this to be correct. The benchmark already takes several hours..
          console.error(e)
        }
      }
    )
    await benchmarkAutomerge(
      benchmarkName,
      doc => { doc.text = new Automerge.Text() },
      edits,
      (doc, edit) => {
        if (edit[1] > 0) {
          doc.text.deleteAt(edit[0], edit[1])
        }
        if (edit[2]) {
          doc.text.insertAt(edit[0], edit[2])
        }
      },
      doc1 => {
        t.assert(doc1.text.join('') === finalText)
      }
    )
    await benchmarkFluid(
      benchmarkName,
      edits,
      (sharedString, edit) => {
        if (edit[2]) {
          sharedString.insertText(edit[0], edit[2])
        }
        if (edit[1] > 0) {
          sharedString.removeText(edit[0], edit[0] + edit[1])
        }
      },
      sharedString => {
        t.assert(sharedString.getText() === finalText)
      }
    )
  }

  {
    const benchmarkName = '[B4 x 100] Apply real-world editing dataset 100 times'
    const multiplicator = 100
    let encodedState = /** @type {any} */ (null)

      await (async () => {
        const doc = new Y.Doc()
        const ytext = doc.getText('text')
        await benchmarkTime('yjs', `${benchmarkName} (time)`, () => {
          for (let iterations = 0; iterations < multiplicator; iterations++) {
            if (iterations > 0 && iterations % 5 === 0) {
              console.log(`Finished ${iterations}%`)
            }
            for (let i = 0; i < edits.length; i++) {
              const edit = edits[i]
              if (edit[1] > 0) {
                ytext.delete(edit[0], edit[1])
              }
              if (edit[2]) {
                ytext.insert(edit[0], edit[2])
              }
            }
          }
        })
        /**
         * @type {any}
         */
        await benchmarkTime('yjs', `${benchmarkName} (encodeTime)`, () => {
          encodedState = Y.encodeStateAsUpdateV2(doc)
        })
      })()

      ; (() => {
        const documentSize = encodedState.byteLength
        setBenchmarkResult('yjs', `${benchmarkName} (docSize)`, `${documentSize} bytes`)
        tryGc()
      })()

      await (async () => {
        const startHeapUsed = getMemUsed()
        // @ts-ignore we only store doc so it is not garbage collected
        let doc = null // eslint-disable-line
        await benchmarkTime('yjs', `${benchmarkName} (parseTime)`, () => {
          doc = new Y.Doc()
          Y.applyUpdateV2(doc, encodedState)
        })
        logMemoryUsed('yjs', benchmarkName, startHeapUsed)
      })()
  }
}
