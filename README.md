
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
|[B1.1] Append N characters (time)                                         |          267 ms |         1775 ms |         8498 ms |         3286 ms |
|[B1.1] Append N characters (avgUpdateSize)                                |        27 bytes |       326 bytes |        46 bytes |       599 bytes |
|[B1.1] Append N characters (docSize)                                      |      6031 bytes |   2161851 bytes |    186031 bytes |   4035114 bytes |
|[B1.1] Append N characters (memUsed)                                      |             0 B |         74.2 MB |          1.9 MB |         63.8 MB |
|[B1.1] Append N characters (parseTime)                                    |            6 ms |          603 ms |           35 ms |          455 ms |
|[B1.2] Insert string of length N (time)                                   |            6 ms |         2739 ms |         8570 ms |          163 ms |
|[B1.2] Insert string of length N (avgUpdateSize)                          |      6031 bytes |   1484719 bytes |    275992 bytes |      6629 bytes |
|[B1.2] Insert string of length N (docSize)                                |      6031 bytes |   1569051 bytes |    186031 bytes |      5818 bytes |
|[B1.2] Insert string of length N (memUsed)                                |             0 B |         52.9 MB |        716.8 kB |             0 B |
|[B1.2] Insert string of length N (parseTime)                              |           13 ms |          452 ms |           41 ms |           14 ms |
|[B1.3] Prepend N characters (time)                                        |          240 ms |        56602 ms |         7913 ms |         3322 ms |
|[B1.3] Prepend N characters (avgUpdateSize)                               |        27 bytes |       290 bytes |        38 bytes |       586 bytes |
|[B1.3] Prepend N characters (docSize)                                     |      6041 bytes |   1946994 bytes |    186031 bytes |   3963410 bytes |
|[B1.3] Prepend N characters (memUsed)                                     |          3.7 MB |         67.4 MB |        905.9 kB |         61.9 MB |
|[B1.3] Prepend N characters (parseTime)                                   |           26 ms |        49740 ms |          888 ms |          468 ms |
|[B1.4] Insert N characters at random positions (time)                     |          267 ms |         2036 ms |         8699 ms |         3512 ms |
|[B1.4] Insert N characters at random positions (avgUpdateSize)            |        29 bytes |       326 bytes |        46 bytes |       611 bytes |
|[B1.4] Insert N characters at random positions (docSize)                  |     29554 bytes |   2159422 bytes |    186031 bytes |   4124746 bytes |
|[B1.4] Insert N characters at random positions (memUsed)                  |             0 B |         70.5 MB |          1.2 MB |         51.2 MB |
|[B1.4] Insert N characters at random positions (parseTime)                |           37 ms |          802 ms |          608 ms |          482 ms |
|[B1.5] Insert N words at random positions (time)                          |          345 ms |         8943 ms |       437888 ms |         5304 ms |
|[B1.5] Insert N words at random positions (avgUpdateSize)                 |        36 bytes |      1587 bytes |       277 bytes |       612 bytes |
|[B1.5] Insert N words at random positions (docSize)                       |     87924 bytes |  10146018 bytes |   1121766 bytes |   3876547 bytes |
|[B1.5] Insert N words at random positions (memUsed)                       |             0 B |        330.2 MB |           15 MB |         64.6 MB |
|[B1.5] Insert N words at random positions (parseTime)                     |           56 ms |         3626 ms |         6378 ms |          633 ms |
|[B1.6] Insert string, then delete it (time)                               |            8 ms |         2290 ms |        27379 ms |          159 ms |
|[B1.6] Insert string, then delete it (avgUpdateSize)                      |      6053 bytes |   1412719 bytes |    413992 bytes |      3630 bytes |
|[B1.6] Insert string, then delete it (docSize)                            |        38 bytes |   1497051 bytes |    240035 bytes |      6525 bytes |
|[B1.6] Insert string, then delete it (memUsed)                            |             0 B |         37.4 MB |             0 B |             0 B |
|[B1.6] Insert string, then delete it (parseTime)                          |           15 ms |          301 ms |           51 ms |           14 ms |
|[B1.7] Insert/Delete strings at random positions (time)                   |          327 ms |         4103 ms |       199755 ms |         6923 ms |
|[B1.7] Insert/Delete strings at random positions (avgUpdateSize)          |        31 bytes |      1100 bytes |       194 bytes |       649 bytes |
|[B1.7] Insert/Delete strings at random positions (docSize)                |     28377 bytes |   7077396 bytes |    687083 bytes |   3903571 bytes |
|[B1.7] Insert/Delete strings at random positions (memUsed)                |          4.3 MB |        162.5 MB |          8.7 MB |         76.7 MB |
|[B1.7] Insert/Delete strings at random positions (parseTime)              |           34 ms |         1843 ms |         1264 ms |          848 ms |
|[B1.8] Append N numbers (time)                                            |          283 ms |         2162 ms |         9091 ms |         3497 ms |
|[B1.8] Append N numbers (avgUpdateSize)                                   |        32 bytes |       333 bytes |        48 bytes |       604 bytes |
|[B1.8] Append N numbers (docSize)                                         |     35636 bytes |   2200671 bytes |    204029 bytes |   3942754 bytes |
|[B1.8] Append N numbers (memUsed)                                         |             0 B |         72.9 MB |          1.5 MB |         53.8 MB |
|[B1.8] Append N numbers (parseTime)                                       |           16 ms |          584 ms |           35 ms |          479 ms |
|[B1.9] Insert Array of N numbers (time)                                   |           14 ms |         2805 ms |         8811 ms |          171 ms |
|[B1.9] Insert Array of N numbers (avgUpdateSize)                          |     35659 bytes |   1523692 bytes |        48 bytes |     63610 bytes |
|[B1.9] Insert Array of N numbers (docSize)                                |     35659 bytes |   1608025 bytes |    204031 bytes |      5849 bytes |
|[B1.9] Insert Array of N numbers (memUsed)                                |             0 B |         52.6 MB |          1.1 MB |             0 B |
|[B1.9] Insert Array of N numbers (parseTime)                              |           17 ms |          453 ms |           35 ms |           22 ms |
|[B1.10] Prepend N numbers (time)                                          |          227 ms |        59800 ms |         8093 ms |         3330 ms |
|[B1.10] Prepend N numbers (avgUpdateSize)                                 |        32 bytes |       297 bytes |        40 bytes |       609 bytes |
|[B1.10] Prepend N numbers (docSize)                                       |     35667 bytes |   1985881 bytes |    204031 bytes |   3997897 bytes |
|[B1.10] Prepend N numbers (memUsed)                                       |          6.7 MB |         67.1 MB |        545.3 kB |         65.2 MB |
|[B1.10] Prepend N numbers (parseTime)                                     |           26 ms |        65629 ms |          738 ms |          459 ms |
|[B1.11] Insert N numbers at random positions (time)                       |          262 ms |         2638 ms |         8736 ms |         3587 ms |
|[B1.11] Insert N numbers at random positions (avgUpdateSize)              |        34 bytes |       332 bytes |        48 bytes |       614 bytes |
|[B1.11] Insert N numbers at random positions (docSize)                    |     59139 bytes |   2198225 bytes |    204029 bytes |   4012897 bytes |
|[B1.11] Insert N numbers at random positions (memUsed)                    |             0 B |         69.8 MB |          1.5 MB |         53.5 MB |
|[B1.11] Insert N numbers at random positions (parseTime)                  |           36 ms |          821 ms |          512 ms |          489 ms |
|[B2.1] Concurrently insert string of length N at index 0 (time)           |            6 ms |         6187 ms |        35446 ms |            2 ms |
|[B2.1] Concurrently insert string of length N at index 0 (updateSize)     |     12058 bytes |   2970726 bytes |    551984 bytes |     13257 bytes |
|[B2.1] Concurrently insert string of length N at index 0 (docSize)        |     12149 bytes |   3164619 bytes |    375131 bytes |      7506 bytes |
|[B2.1] Concurrently insert string of length N at index 0 (memUsed)        |             0 B |        107.8 MB |          4.4 MB |             0 B |
|[B2.1] Concurrently insert string of length N at index 0 (parseTime)      |           14 ms |          864 ms |           72 ms |           16 ms |
|[B2.2] Concurrently insert N characters at random positions (time)        |          135 ms |        55019 ms |        35489 ms |         7242 ms |
|[B2.2] Concurrently insert N characters at random positions (updateSize)  |     66250 bytes |   2753309 bytes |    551952 bytes |   7021005 bytes |
|[B2.2] Concurrently insert N characters at random positions (docSize)     |     66346 bytes |   2947202 bytes |    375131 bytes |   7378247 bytes |
|[B2.2] Concurrently insert N characters at random positions (memUsed)     |          7.9 MB |         97.3 MB |          4.7 MB |        130.7 MB |
|[B2.2] Concurrently insert N characters at random positions (parseTime)   |           42 ms |        59850 ms |         2150 ms |          894 ms |
|[B2.3] Concurrently insert N words at random positions (time)             |          215 ms |       271523 ms |      2451946 ms |         7264 ms |
|[B2.3] Concurrently insert N words at random positions (updateSize)       |    177626 bytes |  17694557 bytes |   3295508 bytes |   7439292 bytes |
|[B2.3] Concurrently insert N words at random positions (docSize)          |    177775 bytes |  18723438 bytes |   2224037 bytes |   6955286 bytes |
|[B2.3] Concurrently insert N words at random positions (memUsed)          |         16.9 MB |        617.5 MB |         39.6 MB |          142 MB |
|[B2.3] Concurrently insert N words at random positions (parseTime)        |          129 ms |        93684 ms |        27264 ms |          983 ms |
|[B2.4] Concurrently insert & delete (time)                                |          448 ms |       539553 ms |      2996484 ms |        24395 ms |
|[B2.4] Concurrently insert & delete (updateSize)                          |    278576 bytes |  26581955 bytes |   5560833 bytes |  14269438 bytes |
|[B2.4] Concurrently insert & delete (docSize)                             |    278720 bytes |  28114528 bytes |   3607278 bytes |   7317403 bytes |
|[B2.4] Concurrently insert & delete (memUsed)                             |         29.1 MB |        848.9 MB |         35.1 MB |        265.8 MB |
|[B2.4] Concurrently insert & delete (parseTime)                           |          263 ms |         9769 ms |        45771 ms |         2345 ms |
|[B3.1] 500 clients concurrently set number in Map (time)                  |           81 ms |          533 ms |                 |         2554 ms |
|[B3.1] 500 clients concurrently set number in Map (updateSize)            |     15923 bytes |     79890 bytes |                 |    301321 bytes |
|[B3.1] 500 clients concurrently set number in Map (docSize)               |     10484 bytes |     93402 bytes |                 |        94 bytes |
|[B3.1] 500 clients concurrently set number in Map (memUsed)               |          1.9 MB |          8.5 MB |                 |        459.9 MB |
|[B3.1] 500 clients concurrently set number in Map (parseTime)             |          232 ms |          602 ms |                 |          464 ms |
|[B3.2] 500 clients concurrently set Object in Map (time)                  |          102 ms |          895 ms |                 |         2769 ms |
|[B3.2] 500 clients concurrently set Object in Map (updateSize)            |     30874 bytes |    221890 bytes |                 |    315303 bytes |
|[B3.2] 500 clients concurrently set Object in Map (docSize)               |     13506 bytes |    245902 bytes |                 |       122 bytes |
|[B3.2] 500 clients concurrently set Object in Map (memUsed)               |             0 B |         16.9 MB |                 |        448.1 MB |
|[B3.2] 500 clients concurrently set Object in Map (parseTime)             |          236 ms |          843 ms |                 |          473 ms |
|[B3.3] 500 clients concurrently set String in Map (time)                  |          111 ms |          742 ms |                 |         3549 ms |
|[B3.3] 500 clients concurrently set String in Map (updateSize)            |    710983 bytes |    774500 bytes |                 |    997350 bytes |
|[B3.3] 500 clients concurrently set String in Map (docSize)               |     11976 bytes |    788012 bytes |                 |       595 bytes |
|[B3.3] 500 clients concurrently set String in Map (memUsed)               |             0 B |         11.6 MB |                 |        462.9 MB |
|[B3.3] 500 clients concurrently set String in Map (parseTime)             |          234 ms |          821 ms |                 |          480 ms |
|[B3.4] 500 clients concurrently insert text in Array (time)               |          102 ms |         1626 ms |          146 ms |       178926 ms |
|[B3.4] 500 clients concurrently insert text in Array (updateSize)         |     16879 bytes |    161850 bytes |     19890 bytes |    440506 bytes |
|[B3.4] 500 clients concurrently insert text in Array (docSize)            |      8404 bytes |    179163 bytes |     16417 bytes |     91492 bytes |
|[B3.4] 500 clients concurrently insert text in Array (memUsed)            |             0 B |         16.6 MB |          1.5 MB |          2.5 GB |
|[B3.4] 500 clients concurrently insert text in Array (parseTime)          |          232 ms |         3288 ms |          364 ms |         1234 ms |

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
