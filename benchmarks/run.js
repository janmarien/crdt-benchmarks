import './bundle.js'
import { runBenchmarks, runNumberBenchmarks } from './b1.js'
import { runBenchmarksB2 } from './b2.js'
import { runBenchmarksB3 } from './b3.js'
import  {runBenchmarksB4 } from './b4.js'
import { benchmarkResults, N } from './utils.js'

(async () => {
  try {
    await runBenchmarks();
    await runNumberBenchmarks();
    await runBenchmarksB2();
    await runBenchmarksB3();
    await runBenchmarksB4();
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


