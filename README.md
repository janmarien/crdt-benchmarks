
# CRDT benchmarks

> A collection of reproducible benchmarks. *PRs are welcome.*

```sh
# Install Node.js https://nodejs.org
npm i && npm start
```

You can find the benchmark results of Automerge's current [`performance`](https://github.com/automerge/automerge/pull/253) branch [here](https://github.com/dmonad/crdt-benchmarks/pull/4).

## Benchmarks

#### B1: No conflicts

Simulate two clients. One client modifies a text object and sends update messages to the other client. We measure the time to perform the task (`time`), the amount of data exchanged (`avgUpdateSize`), the size of the encoded document after the task is performed (`docSize`), the time to parse the encoded document (`parseTime`), and the memory used to hold the decoded document (`memUsed`).

#### B2: Two users producing conflicts

Simulate two clients. Both start with a synced text object containing 100 characters. Both clients modify the text object in a single transaction and then send their changes to the other client. We measure the time to sync concurrent changes into a single client (`time`), the size of the update messages (`updateSize`), the size of the encoded document after the task is performed (`docSize`), the time to parse the encoded document (`parseTime`), and the memory used to hold the decoded document (`memUsed`).

#### B3: Many conflicts

Simulate `√N` concurrent actions. We measure the time to perform the task
and sync all clients (`time`), the size of the update messages (`updateSize`),
the size of the encoded document after the task is performed (`docSize`),
the time to parse the encoded document (`parseTime`), and the memory used to hold the decoded document (`memUsed`).
The logarithm of `N` was
chosen because `√N` concurrent actions may result in up to `√N^2 - 1`
conflicts (apply action 1: 0 conlict; apply action2: 1 conflict, apply action 2: 2 conflicts, ..).

#### B4: Real-world editing dataset

Replay a real-world editing dataset. This dataset contains the character-by-character editing trace of a large-ish text document, the LaTeX source of this paper: https://arxiv.org/abs/1608.03960

Source: https://github.com/automerge/automerge-perf/tree/master/edit-by-index

* 182,315 single-character insertion operations
*  77,463 single-character deletion operations
* 259,778 operations totally
* 104,852 characters in the final document

We simulate one client replaying all changes and storing each update. We measure the time to replay
the changes and the size of all update messages (`updateSize`),
the size of the encoded document after the task is performed (`docSize`), the time to encode the document (`encodeTime`),
the time to parse the encoded document (`parseTime`), and the memory used to hold the decoded document in memory (`memUsed`).

** For now we replay all actions in a single transaction, otherwise Automerge is running out of memory.

##### [B4 x 100] Real-world editing dataset 100 times

Replay the [B4] dataset one hundred times. The final document has a size of over 10 million characters. As comparison, the book "Game of Thrones: A Song of Ice and Fire" is only 1.6 million characters long (including whitespace).

* 18,231,500 single-character insertion operations
*  7,746,300 single-character deletion operations
* 25,977,800 operations totally
* 10,485,200 characters in the final document

### Results

**Notes**
* The benchmarks were performed on a desktop computer "Intel® Core™ i5-8400 CPU @ 2.80GHz × 6" / Ubuntu 20.04 and Node 12.18.1
* There is a more exchaustive benchmark at the bottom that only runs benchmarks on Yjs.
* `memUsed` only approximates the amount of memory used. We run the JavaScript garbage collector and use the heap-size difference before and after the benchmark is performed. If the heap is highly fragmented, the heap size might be larger than the actual amount of data stored in the heap. In some cases this even leads to a `memUsed` of less than zero.
* Preliminary benchmark results for native implementation of the [Ron/Chronofold CRDT](https://github.com/gritzko/ron) (written in C++) are posted [in this thread](https://github.com/dmonad/crdt-benchmarks/issues/3).

| N = 6000 | [Yjs](https://github.com/yjs/yjs) | [Automerge](https://github.com/automerge/automerge) | [delta-crdts](https://github.com/peer-base/js-delta-crdts) | [Fluid](https://fluidframework.com)
| :- | -: | -: | -: | -: |
|Version                                                                   |          13.5.2 |          0.14.2 |          0.10.3 |          0.36.0 |
|Bundle size                                                               |     77013 bytes |    259888 bytes |    219525 bytes |   1140901 bytes |
|Bundle size (gzipped)                                                     |     22509 bytes |     61524 bytes |     63359 bytes |    316375 bytes |
|[B1.1] Append N characters (time)                                         |          270 ms |         1731 ms |         8665 ms |         3259 ms |
|[B1.1] Append N characters (avgUpdateSize)                                |        27 bytes |       326 bytes |        46 bytes |       606 bytes |
|[B1.1] Append N characters (docSize)                                      |      6031 bytes |   2161851 bytes |    186031 bytes |   4084853 bytes |
|[B1.1] Append N characters (memUsed)                                      |             0 B |         74.2 MB |          1.9 MB |         50.5 MB |
|[B1.1] Append N characters (parseTime)                                    |            6 ms |          598 ms |           33 ms |                 |
|[B1.2] Insert string of length N (time)                                   |            6 ms |         2993 ms |         8218 ms |          161 ms |
|[B1.2] Insert string of length N (avgUpdateSize)                          |      6031 bytes |   1484719 bytes |    275992 bytes |      6628 bytes |
|[B1.2] Insert string of length N (docSize)                                |      6031 bytes |   1569051 bytes |    186031 bytes |      5817 bytes |
|[B1.2] Insert string of length N (memUsed)                                |             0 B |         52.8 MB |          1.5 MB |             0 B |
|[B1.2] Insert string of length N (parseTime)                              |           12 ms |          443 ms |           37 ms |                 |
|[B1.3] Prepend N characters (time)                                        |          240 ms |        74764 ms |         7971 ms |         3266 ms |
|[B1.3] Prepend N characters (avgUpdateSize)                               |        27 bytes |       290 bytes |        38 bytes |       605 bytes |
|[B1.3] Prepend N characters (docSize)                                     |      6041 bytes |   1946994 bytes |    186031 bytes |   4093831 bytes |
|[B1.3] Prepend N characters (memUsed)                                     |          3.9 MB |         67.3 MB |        910.3 kB |           49 MB |
|[B1.3] Prepend N characters (parseTime)                                   |           27 ms |        72839 ms |          739 ms |                 |
|[B1.4] Insert N characters at random positions (time)                     |          271 ms |         2036 ms |         8883 ms |         3566 ms |
|[B1.4] Insert N characters at random positions (avgUpdateSize)            |        29 bytes |       326 bytes |        46 bytes |       601 bytes |
|[B1.4] Insert N characters at random positions (docSize)                  |     29554 bytes |   2159422 bytes |    186031 bytes |   4050502 bytes |
|[B1.4] Insert N characters at random positions (memUsed)                  |             0 B |         70.6 MB |            1 MB |         38.2 MB |
|[B1.4] Insert N characters at random positions (parseTime)                |           36 ms |          723 ms |          628 ms |                 |
|[B1.5] Insert N words at random positions (time)                          |          330 ms |         9198 ms |       440906 ms |         5196 ms |
|[B1.5] Insert N words at random positions (avgUpdateSize)                 |        36 bytes |      1587 bytes |       277 bytes |       615 bytes |
|[B1.5] Insert N words at random positions (docSize)                       |     87924 bytes |  10146018 bytes |   1121766 bytes |   3896577 bytes |
|[B1.5] Insert N words at random positions (memUsed)                       |             0 B |          330 MB |         16.2 MB |         47.6 MB |
|[B1.5] Insert N words at random positions (parseTime)                     |           56 ms |         3553 ms |         6541 ms |                 |
|[B1.6] Insert string, then delete it (time)                               |            8 ms |         2233 ms |        27848 ms |          161 ms |
|[B1.6] Insert string, then delete it (avgUpdateSize)                      |      6053 bytes |   1412719 bytes |    413992 bytes |      3630 bytes |
|[B1.6] Insert string, then delete it (docSize)                            |        38 bytes |   1497051 bytes |    240035 bytes |      6525 bytes |
|[B1.6] Insert string, then delete it (memUsed)                            |             0 B |         37.3 MB |             0 B |             0 B |
|[B1.6] Insert string, then delete it (parseTime)                          |           13 ms |          308 ms |           52 ms |                 |
|[B1.7] Insert/Delete strings at random positions (time)                   |          326 ms |         4171 ms |       211814 ms |         6925 ms |
|[B1.7] Insert/Delete strings at random positions (avgUpdateSize)          |        31 bytes |      1100 bytes |       194 bytes |       649 bytes |
|[B1.7] Insert/Delete strings at random positions (docSize)                |     28377 bytes |   7077396 bytes |    687083 bytes |   3901022 bytes |
|[B1.7] Insert/Delete strings at random positions (memUsed)                |          4.5 MB |        162.4 MB |          8.8 MB |         58.4 MB |
|[B1.7] Insert/Delete strings at random positions (parseTime)              |           34 ms |         1910 ms |         1299 ms |                 |
|[B1.8] Append N numbers (time)                                            |          288 ms |         2214 ms |         9109 ms |         3441 ms |
|[B1.8] Append N numbers (avgUpdateSize)                                   |        32 bytes |       333 bytes |        48 bytes |       613 bytes |
|[B1.8] Append N numbers (docSize)                                         |     35636 bytes |   2200671 bytes |    204029 bytes |   4002415 bytes |
|[B1.8] Append N numbers (memUsed)                                         |             0 B |         73.7 MB |          1.4 MB |         40.5 MB |
|[B1.8] Append N numbers (parseTime)                                       |           17 ms |          668 ms |           33 ms |                 |
|[B1.9] Insert Array of N numbers (time)                                   |           15 ms |         3053 ms |         8967 ms |          172 ms |
|[B1.9] Insert Array of N numbers (avgUpdateSize)                          |     35659 bytes |   1523692 bytes |        48 bytes |     63610 bytes |
|[B1.9] Insert Array of N numbers (docSize)                                |     35659 bytes |   1608025 bytes |    204031 bytes |      5849 bytes |
|[B1.9] Insert Array of N numbers (memUsed)                                |             0 B |         52.3 MB |          1.5 MB |             0 B |
|[B1.9] Insert Array of N numbers (parseTime)                              |           15 ms |          468 ms |           33 ms |                 |
|[B1.10] Prepend N numbers (time)                                          |          232 ms |        59095 ms |         8067 ms |         3363 ms |
|[B1.10] Prepend N numbers (avgUpdateSize)                                 |        32 bytes |       297 bytes |        40 bytes |       608 bytes |
|[B1.10] Prepend N numbers (docSize)                                       |     35667 bytes |   1985881 bytes |    204031 bytes |   3993177 bytes |
|[B1.10] Prepend N numbers (memUsed)                                       |          6.9 MB |         67.1 MB |        603.8 kB |         50.1 MB |
|[B1.10] Prepend N numbers (parseTime)                                     |           27 ms |        65416 ms |          738 ms |                 |
|[B1.11] Insert N numbers at random positions (time)                       |          264 ms |         2621 ms |         8866 ms |         3698 ms |
|[B1.11] Insert N numbers at random positions (avgUpdateSize)              |        34 bytes |       332 bytes |        48 bytes |       623 bytes |
|[B1.11] Insert N numbers at random positions (docSize)                    |     59139 bytes |   2198225 bytes |    204029 bytes |   4078798 bytes |
|[B1.11] Insert N numbers at random positions (memUsed)                    |             0 B |         70.5 MB |          1.4 MB |         40.2 MB |
|[B1.11] Insert N numbers at random positions (parseTime)                  |           35 ms |          793 ms |          572 ms |                 |
|[B2.1] Concurrently insert string of length N at index 0 (time)           |            5 ms |         6333 ms |        36414 ms |            2 ms |
|[B2.1] Concurrently insert string of length N at index 0 (updateSize)     |     12058 bytes |   2970726 bytes |    551984 bytes |                 |
|[B2.1] Concurrently insert string of length N at index 0 (docSize)        |     12151 bytes |   3164619 bytes |    375131 bytes |      7507 bytes |
|[B2.1] Concurrently insert string of length N at index 0 (memUsed)        |             0 B |        107.1 MB |            4 MB |             0 B |
|[B2.1] Concurrently insert string of length N at index 0 (parseTime)      |           13 ms |          825 ms |           76 ms |                 |
|[B2.1] Concurrently insert string of length N at index 0 (avgUpdateSize)  |                 |                 |                 |      6629 bytes |
|[B2.2] Concurrently insert N characters at random positions (time)        |          134 ms |        58419 ms |        36248 ms |         7156 ms |
|[B2.2] Concurrently insert N characters at random positions (updateSize)  |     66250 bytes |   2753309 bytes |    551952 bytes |                 |
|[B2.2] Concurrently insert N characters at random positions (docSize)     |     66346 bytes |   2947202 bytes |    375131 bytes |   7393518 bytes |
|[B2.2] Concurrently insert N characters at random positions (memUsed)     |          7.9 MB |         97.5 MB |          4.7 MB |        103.7 MB |
|[B2.2] Concurrently insert N characters at random positions (parseTime)   |           44 ms |        66345 ms |         2019 ms |                 |
|[B2.2] Concurrently insert N characters at random positions (avgUpdateSize) |                 |                 |                 |       584 bytes |
|[B2.3] Concurrently insert N words at random positions (time)             |          214 ms |       267347 ms |      2378447 ms |         7155 ms |
|[B2.3] Concurrently insert N words at random positions (updateSize)       |    177626 bytes |  17694557 bytes |   3295508 bytes |                 |
|[B2.3] Concurrently insert N words at random positions (docSize)          |    177768 bytes |  18723438 bytes |   2224037 bytes |   7031286 bytes |
|[B2.3] Concurrently insert N words at random positions (memUsed)          |         16.8 MB |        621.1 MB |         39.9 MB |        111.2 MB |
|[B2.3] Concurrently insert N words at random positions (parseTime)        |           97 ms |        93189 ms |        26649 ms |                 |
|[B2.3] Concurrently insert N words at random positions (avgUpdateSize)    |                 |                 |                 |       615 bytes |
|[B2.4] Concurrently insert & delete (time)                                |          433 ms |       487156 ms |      2872111 ms |        24023 ms |
|[B2.4] Concurrently insert & delete (updateSize)                          |    278576 bytes |  26581955 bytes |   5560833 bytes |                 |
|[B2.4] Concurrently insert & delete (docSize)                             |    278719 bytes |  28114528 bytes |   3607278 bytes |   7428170 bytes |
|[B2.4] Concurrently insert & delete (memUsed)                             |         29.2 MB |        851.9 MB |         35.1 MB |        203.6 MB |
|[B2.4] Concurrently insert & delete (parseTime)                           |          241 ms |         9594 ms |        43455 ms |                 |
|[B2.4] Concurrently insert & delete (avgUpdateSize)                       |                 |                 |                 |       591 bytes |
|[B3.1] 500 clients concurrently set number in Map (time)                  |           82 ms |          541 ms |                 |         2533 ms |
|[B3.1] 500 clients concurrently set number in Map (updateSize)            |     15923 bytes |     79890 bytes |                 |                 |
|[B3.1] 500 clients concurrently set number in Map (docSize)               |     10476 bytes |     93402 bytes |                 |        94 bytes |
|[B3.1] 500 clients concurrently set number in Map (memUsed)               |          1.9 MB |          8.5 MB |                 |        458.7 MB |
|[B3.1] 500 clients concurrently set number in Map (parseTime)             |          184 ms |          575 ms |                 |                 |
|[B3.1] 500 clients concurrently set number in Map (avgUpdateSize)         |                 |                 |                 |       600 bytes |
|[B3.2] 500 clients concurrently set Object in Map (time)                  |           99 ms |          921 ms |                 |         3333 ms |
|[B3.2] 500 clients concurrently set Object in Map (updateSize)            |     30868 bytes |    221890 bytes |                 |                 |
|[B3.2] 500 clients concurrently set Object in Map (docSize)               |     13482 bytes |    245902 bytes |                 |       122 bytes |
|[B3.2] 500 clients concurrently set Object in Map (memUsed)               |             0 B |           17 MB |                 |        446.3 MB |
|[B3.2] 500 clients concurrently set Object in Map (parseTime)             |          188 ms |          821 ms |                 |                 |
|[B3.2] 500 clients concurrently set Object in Map (avgUpdateSize)         |                 |                 |                 |       628 bytes |
|[B3.3] 500 clients concurrently set String in Map (time)                  |          109 ms |          718 ms |                 |         4030 ms |
|[B3.3] 500 clients concurrently set String in Map (updateSize)            |    710980 bytes |    774500 bytes |                 |                 |
|[B3.3] 500 clients concurrently set String in Map (docSize)               |     11969 bytes |    788012 bytes |                 |       595 bytes |
|[B3.3] 500 clients concurrently set String in Map (memUsed)               |             0 B |         11.6 MB |                 |        461.6 MB |
|[B3.3] 500 clients concurrently set String in Map (parseTime)             |          186 ms |          759 ms |                 |                 |
|[B3.3] 500 clients concurrently set String in Map (avgUpdateSize)         |                 |                 |                 |      1990 bytes |
|[B3.4] 500 clients concurrently insert text in Array (time)               |          101 ms |         1835 ms |          142 ms |       182214 ms |
|[B3.4] 500 clients concurrently insert text in Array (updateSize)         |     16870 bytes |    161850 bytes |     19890 bytes |                 |
|[B3.4] 500 clients concurrently insert text in Array (docSize)            |      8395 bytes |    179163 bytes |     16417 bytes |     82909 bytes |
|[B3.4] 500 clients concurrently insert text in Array (memUsed)            |             0 B |         16.6 MB |          1.5 MB |          1.9 GB |
|[B3.4] 500 clients concurrently insert text in Array (parseTime)          |          184 ms |         3852 ms |          315 ms |                 |
|[B3.4] 500 clients concurrently insert text in Array (avgUpdateSize)      |                 |                 |                 |      1180 bytes |

| N = 60000 | Yjs | automerge |
| :- | -: | -: |
|Bundle size                                                               |     65939 bytes |    259763 bytes |
|Bundle size (gzipped)                                                     |     19383 bytes |     61478 bytes |
|[B1.1] Append N characters (time)                                         |         1582 ms |                 |
|[B1.1] Append N characters (avgUpdateSize)                                |        29 bytes |                 |
|[B1.1] Append N characters (docSize)                                      |     60034 bytes |                 |
|[B1.1] Append N characters (parseTime)                                    |            1 ms |                 |
|[B1.1] Append N characters (memUsed)                                      |         16.3 MB |                 |
|[B1.1] Append N characters                                                |                 |        skipping |
|[B1.2] Insert string of length N (time)                                   |            8 ms |                 |
|[B1.2] Insert string of length N (avgUpdateSize)                          |     60034 bytes |                 |
|[B1.2] Insert string of length N (docSize)                                |     60034 bytes |                 |
|[B1.2] Insert string of length N (parseTime)                              |            1 ms |                 |
|[B1.2] Insert string of length N (memUsed)                                |          1.8 MB |                 |
|[B1.2] Insert string of length N                                          |                 |        skipping |
|[B1.3] Prepend N characters (time)                                        |         1229 ms |                 |
|[B1.3] Prepend N characters (avgUpdateSize)                               |        29 bytes |                 |
|[B1.3] Prepend N characters (docSize)                                     |     60047 bytes |                 |
|[B1.3] Prepend N characters (parseTime)                                   |           45 ms |                 |
|[B1.3] Prepend N characters (memUsed)                                     |         35.2 MB |                 |
|[B1.3] Prepend N characters                                               |                 |        skipping |
|[B1.4] Insert N characters at random positions (time)                     |         1801 ms |                 |
|[B1.4] Insert N characters at random positions (avgUpdateSize)            |        31 bytes |                 |
|[B1.4] Insert N characters at random positions (docSize)                  |    374543 bytes |                 |
|[B1.4] Insert N characters at random positions (parseTime)                |           53 ms |                 |
|[B1.4] Insert N characters at random positions (memUsed)                  |         48.9 MB |                 |
|[B1.4] Insert N characters at random positions                            |                 |        skipping |
|[B1.5] Insert N words at random positions (time)                          |         5711 ms |                 |
|[B1.5] Insert N words at random positions (avgUpdateSize)                 |        36 bytes |                 |
|[B1.5] Insert N words at random positions (docSize)                       |    932585 bytes |                 |
|[B1.5] Insert N words at random positions (parseTime)                     |          205 ms |                 |
|[B1.5] Insert N words at random positions (memUsed)                       |         51.2 MB |                 |
|[B1.5] Insert N words at random positions                                 |                 |        skipping |
|[B1.6] Insert string, then delete it (time)                               |            7 ms |                 |
|[B1.6] Insert string, then delete it (avgUpdateSize)                      |     60057 bytes |                 |
|[B1.6] Insert string, then delete it (docSize)                            |        40 bytes |                 |
|[B1.6] Insert string, then delete it (parseTime)                          |            0 ms |                 |
|[B1.6] Insert string, then delete it (memUsed)                            |        924.7 kB |                 |
|[B1.6] Insert string, then delete it                                      |                 |        skipping |
|[B1.7] Insert/Delete strings at random positions (time)                   |         4771 ms |                 |
|[B1.7] Insert/Delete strings at random positions (avgUpdateSize)          |        32 bytes |                 |
|[B1.7] Insert/Delete strings at random positions (docSize)                |    362959 bytes |                 |
|[B1.7] Insert/Delete strings at random positions (parseTime)              |           86 ms |                 |
|[B1.7] Insert/Delete strings at random positions (memUsed)                |         67.7 MB |                 |
|[B1.7] Insert/Delete strings at random positions                          |                 |        skipping |
|[B1.8] Append N numbers (time)                                            |        15069 ms |                 |
|[B1.8] Append N numbers (avgUpdateSize)                                   |        34 bytes |                 |
|[B1.8] Append N numbers (docSize)                                         |    356220 bytes |                 |
|[B1.8] Append N numbers (parseTime)                                       |            2 ms |                 |
|[B1.8] Append N numbers (memUsed)                                         |         19.5 MB |                 |
|[B1.8] Append N numbers                                                   |                 |        skipping |
|[B1.9] Insert Array of N numbers (time)                                   |            6 ms |                 |
|[B1.9] Insert Array of N numbers (avgUpdateSize)                          |    356278 bytes |                 |
|[B1.9] Insert Array of N numbers (docSize)                                |    356278 bytes |                 |
|[B1.9] Insert Array of N numbers (parseTime)                              |            2 ms |                 |
|[B1.9] Insert Array of N numbers (memUsed)                                |             0 B |                 |
|[B1.9] Insert Array of N numbers                                          |                 |        skipping |
|[B1.10] Prepend N numbers (time)                                          |         1185 ms |                 |
|[B1.10] Prepend N numbers (avgUpdateSize)                                 |        34 bytes |                 |
|[B1.10] Prepend N numbers (docSize)                                       |    356347 bytes |                 |
|[B1.10] Prepend N numbers (parseTime)                                     |           29 ms |                 |
|[B1.10] Prepend N numbers (memUsed)                                       |             0 B |                 |
|[B1.10] Prepend N numbers                                                 |                 |        skipping |
|[B1.11] Insert N numbers at random positions (time)                       |         1901 ms |                 |
|[B1.11] Insert N numbers at random positions (avgUpdateSize)              |        36 bytes |                 |
|[B1.11] Insert N numbers at random positions (docSize)                    |    670910 bytes |                 |
|[B1.11] Insert N numbers at random positions (parseTime)                  |           52 ms |                 |
|[B1.11] Insert N numbers at random positions (memUsed)                    |         84.5 MB |                 |
|[B1.11] Insert N numbers at random positions                              |                 |        skipping |
|[B2.1] Concurrently insert string of length N at index 0 (time)           |            5 ms |                 |
|[B2.1] Concurrently insert string of length N at index 0 (updateSize)     |    120064 bytes |                 |
|[B2.1] Concurrently insert string of length N at index 0 (docSize)        |    120154 bytes |                 |
|[B2.1] Concurrently insert string of length N at index 0 (parseTime)      |            2 ms |                 |
|[B2.1] Concurrently insert string of length N at index 0 (memUsed)        |          4.2 MB |                 |
|[B2.1] Concurrently insert string of length N at index 0                  |                 |        skipping |
|[B2.2] Concurrently insert N characters at random positions (time)        |         1017 ms |                 |
|[B2.2] Concurrently insert N characters at random positions (updateSize)  |    760850 bytes |                 |
|[B2.2] Concurrently insert N characters at random positions (docSize)     |    760942 bytes |                 |
|[B2.2] Concurrently insert N characters at random positions (parseTime)   |           91 ms |                 |
|[B2.2] Concurrently insert N characters at random positions (memUsed)     |             0 B |                 |
|[B2.2] Concurrently insert N characters at random positions               |                 |        skipping |
|[B2.3] Concurrently insert N words at random positions (time)             |         9163 ms |                 |
|[B2.3] Concurrently insert N words at random positions (updateSize)       |   1877355 bytes |                 |
|[B2.3] Concurrently insert N words at random positions (docSize)          |   1877486 bytes |                 |
|[B2.3] Concurrently insert N words at random positions (parseTime)        |          344 ms |                 |
|[B2.3] Concurrently insert N words at random positions (memUsed)          |             0 B |                 |
|[B2.3] Concurrently insert N words at random positions                    |                 |        skipping |
|[B2.4] Concurrently insert & delete (time)                                |        18214 ms |                 |
|[B2.4] Concurrently insert & delete (updateSize)                          |   2883749 bytes |                 |
|[B2.4] Concurrently insert & delete (docSize)                             |   2883876 bytes |                 |
|[B2.4] Concurrently insert & delete (parseTime)                           |          661 ms |                 |
|[B2.4] Concurrently insert & delete (memUsed)                             |        258.2 MB |                 |
|[B2.4] Concurrently insert & delete                                       |                 |        skipping |
|[B3.1] √N clients concurrently set number in Map (time)                   |           20 ms |                 |
|[B3.1] √N clients concurrently set number in Map (updateSize)             |      7736 bytes |                 |
|[B3.1] √N clients concurrently set number in Map (docSize)                |      5121 bytes |                 |
|[B3.1] √N clients concurrently set number in Map (parseTime)              |            3 ms |                 |
|[B3.1] √N clients concurrently set number in Map (memUsed)                |             0 B |                 |
|[B3.1] √N clients concurrently set number in Map                          |                 |        skipping |
|[B3.2] √N clients concurrently set Object in Map (time)                   |           29 ms |                 |
|[B3.2] √N clients concurrently set Object in Map (updateSize)             |     15011 bytes |                 |
|[B3.2] √N clients concurrently set Object in Map (docSize)                |      6612 bytes |                 |
|[B3.2] √N clients concurrently set Object in Map (parseTime)              |            2 ms |                 |
|[B3.2] √N clients concurrently set Object in Map (memUsed)                |          6.6 MB |                 |
|[B3.2] √N clients concurrently set Object in Map                          |                 |        skipping |
|[B3.3] √N clients concurrently set String in Map (time)                   |           24 ms |                 |
|[B3.3] √N clients concurrently set String in Map (updateSize)             |    159565 bytes |                 |
|[B3.3] √N clients concurrently set String in Map (docSize)                |      5601 bytes |                 |
|[B3.3] √N clients concurrently set String in Map (parseTime)              |            3 ms |                 |
|[B3.3] √N clients concurrently set String in Map (memUsed)                |          6.4 MB |                 |
|[B3.3] √N clients concurrently set String in Map                          |                 |        skipping |
|[B3.4] √N clients concurrently insert text in Array (time)                |           20 ms |                 |
|[B3.4] √N clients concurrently insert text in Array (updateSize)          |      8185 bytes |                 |
|[B3.4] √N clients concurrently insert text in Array (docSize)             |      4062 bytes |                 |
|[B3.4] √N clients concurrently insert text in Array (parseTime)           |            0 ms |                 |
|[B3.4] √N clients concurrently insert text in Array (memUsed)             |             0 B |                 |
|[B3.4] √N clients concurrently insert text in Array                       |                 |        skipping |
|[B4] Apply real-world editing dataset (time)                              |         5238 ms |                 |
|[B4] Apply real-world editing dataset (updateSize)                        |   7306126 bytes |                 |
|[B4] Apply real-world editing dataset (encodeTime)                        |           13 ms |                 |
|[B4] Apply real-world editing dataset (docSize)                           |    159927 bytes |                 |
|[B4] Apply real-world editing dataset (parseTime)                         |           16 ms |                 |
|[B4] Apply real-world editing dataset (memUsed)                           |          6.9 MB |                 |
|[B4] Apply real-world editing dataset                                     |                 |        skipping |
|[B4 x 100] Apply real-world editing dataset 100 times (time)              |       198383 ms |                 |
|[B4 x 100] Apply real-world editing dataset 100 times (encodeTime)        |          617 ms |                 |
|[B4 x 100] Apply real-world editing dataset 100 times (docSize)           |  15989245 bytes |                 |
|[B4 x 100] Apply real-world editing dataset 100 times (parseTime)         |         2127 ms |                 |
|[B4 x 100] Apply real-world editing dataset 100 times (memUsed)           |        165.5 MB |                 |



## Development

Modify the `N` variable in `benchmarks/utils.js` to increase the difficulty.

```sh
npm run watch
node dist/benchmark.js
```

Now you can also open `benchmark.html` to run the benchmarks in the browser.

## License

[The MIT License](./LICENSE) © Kevin Jahns

Except for /b4-editing-trace.js © Martin Kleppmann
