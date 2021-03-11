import './bundle.js'
import { runBenchmarks, runNumberBenchmarks } from './b1.js'
//import './b2.js'
//import './b3.js'
//import './b4.js'
import { benchmarkResults, N } from './utils.js'

(async () => {
  try {
    await runBenchmarks();
    await runNumberBenchmarks();
    // print markdown table with the results
    let mdTable = `| N = ${N} | [Yjs](https://github.com/yjs/yjs) | [Automerge](https://github.com/automerge/automerge) | [delta-crdts](https://github.com/peer-base/js-delta-crdts) | [Fluid](https://fluidframework.com) \n`
    mdTable += '| :- | -: | -: | -: | -: |\n'
    for (const id in benchmarkResults) {
      mdTable += `|${id.padEnd(73, ' ')} | ${(benchmarkResults[id].yjs || '').padStart(15, ' ')} | ${(benchmarkResults[id].automerge || '').padStart(15, ' ')} | ${(benchmarkResults[id]['delta-crdts'] || '').padStart(15, ' ')} | ${(benchmarkResults[id]['fluid'] || '').padStart(15, ' ')} |\n`
    }
    console.log(mdTable)
    process.exit(0)
  } catch (e) {
    console.log(e)
    process.exit(-1)
  }
})()


