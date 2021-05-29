
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
* The benchmarks were performed on a desktop computer "AMD® Ryzen™ 3900X CPU @ 3.80GHz × 12" / Windows 10 and Node 14.16
* There is a more exchaustive benchmark at the bottom that only runs benchmarks on Yjs.
* `memUsed` only approximates the amount of memory used. We run the JavaScript garbage collector and use the heap-size difference before and after the benchmark is performed. If the heap is highly fragmented, the heap size might be larger than the actual amount of data stored in the heap. In some cases this even leads to a `memUsed` of less than zero.
* Preliminary benchmark results for native implementation of the [Ron/Chronofold CRDT](https://github.com/gritzko/ron) (written in C++) are posted [in this thread](https://github.com/dmonad/crdt-benchmarks/issues/3).

| N = 6000                                                                 | [Yjs](https://github.com/yjs/yjs) | [Automerge](https://github.com/automerge/automerge) | [delta-crdts](https://github.com/peer-base/js-delta-crdts) | [Fluid](https://fluidframework.com) | [Fluid (TinyLicious)](https://fluidframework.com) |
|--------------------------------------------------------------------------|-----------------------------------|-----------------------------------------------------|------------------------------------------------------------|-------------------------------------|---------------------------------------------------|
| Version                                                                  | 13.5.2                            | 0.14.2                                              | 0.10.3                                                     | 0.36.0                              | 0.36.0                                            |
| Bundle size                                                              | 77013 bytes                       | 259888 bytes                                        | 219525 bytes                                               | 1140901 bytes                       | 1140901 bytes                                     |
| Bundle size (gzipped)                                                    | 22509 bytes                       | 61524 bytes                                         | 63359 bytes                                                | 316375 bytes                        | 316375 bytes                                      |
| [B1.1] Append N characters (time)                                        | 268 ms                            | 1686 ms                                             | 8453 ms                                                    | 3343 ms                             | 2007 ms                                           |
| [B1.1] Append N characters (avgUpdateSize)                               | 26 bytes                          | 326 bytes                                           | 46 bytes                                                   | 590 bytes                           | 574 bytes                                         |
| [B1.1] Append N characters (docSize)                                     | 6030 bytes                        | 2161851 bytes                                       | 186031 bytes                                               | 11099 bytes                         | 10991 bytes                                       |
| [B1.1] Append N characters (memUsed)                                     | 0 B                               | 73.9 MB                                             | 2.3 MB                                                     | 65.6 MB                             | 51.3 MB                                           |
| [B1.1] Append N characters (parseTime)                                   | 13 ms                             | 681 ms                                              | 41 ms                                                      | 481 ms                              | 573 ms                                            |
| [B1.2] Insert string of length N (time)                                  | 6 ms                              | 2628 ms                                             | 8154 ms                                                    | 162 ms                              | 13 ms                                             |
| [B1.2] Insert string of length N (avgUpdateSize)                         | 6031 bytes                        | 1484719 bytes                                       | 275992 bytes                                               | 6628 bytes                          | 6564 bytes                                        |
| [B1.2] Insert string of length N (docSize)                               | 6031 bytes                        | 1569051 bytes                                       | 186031 bytes                                               | 11084 bytes bytes                   | 10979 bytes                                       |
| [B1.2] Insert string of length N (memUsed)                               | 0 B                               | 53.2 MB                                             | 1.9 MB                                                     | 0 B                                 | 186.8 KB                                          |
| [B1.2] Insert string of length N (parseTime)                             | 19 ms                             | 450 ms                                              | 44 ms                                                      | 20 ms                               | 56 ms                                             |
| [B1.3] Prepend N characters (time)                                       | 231 ms                            | 60613 ms                                            | 7979 ms                                                    | 3337 ms                             | 1946 ms                                           |
| [B1.3] Prepend N characters (avgUpdateSize)                              | 27 bytes                          | 290 bytes                                           | 38 bytes                                                   | 588 bytes                           | 571 bytes                                         |
| [B1.3] Prepend N characters (docSize)                                    | 6041 bytes                        | 1946994 bytes                                       | 186031 bytes                                               | 11099 bytes                         | 10991 bytes                                       |
| [B1.3] Prepend N characters (memUsed)                                    | 3.3 MB                            | 66.6 MB                                             | 1.8 MB                                                     | 61.9 MB                             | 48.5 MB                                           |
| [B1.3] Prepend N characters (parseTime)                                  | 32 ms                             | 56294 ms                                            | 756 ms                                                     | 457 ms                              | 587 ms                                            |
| [B1.4] Insert N characters at random positions (time)                    | 267 ms                            | 2019 ms                                             | 8089 ms                                                    | 3583 ms                             | 2084 ms                                           |
| [B1.4] Insert N characters at random positions (avgUpdateSize)           | 29 bytes                          | 326 bytes                                           | 46 bytes                                                   | 595 bytes                           | 574 ms                                            |
| [B1.4] Insert N characters at random positions (docSize)                 | 29554 bytes                       | 2159422 bytes                                       | 186031 bytes                                               | 11099 bytes                         | 10991 bytes                                       |
| [B1.4] Insert N characters at random positions (memUsed)                 | 0 B                               | 70.1 MB                                             | 1.9 MB                                                     | 50 MB                               | 49.1 MB                                           |
| [B1.4] Insert N characters at random positions (parseTime)               | 43 ms                             | 728 ms                                              | 538 ms                                                     | 498 ms                              | 536 ms                                            |
| [B1.5] Insert N words at random positions (time)                         | 327 ms                            | 8901 ms                                             | 447854 ms                                                  | 5175 ms                             | 3550 ms                                           |
| [B1.5] Insert N words at random positions (avgUpdateSize)                | 36 bytes                          | 1587 bytes                                          | 277 bytes                                                  | 614 bytes                           | 611 bytes                                         |
| [B1.5] Insert N words at random positions (docSize)                      | 87924 bytes                       | 10146018 bytes                                      | 1121766 bytes                                              | 41288 bytes                         | 41180 bytes                                       |
| [B1.5] Insert N words at random positions (memUsed)                      | 0 B                               | 328.9 MB                                            | 15.8 MB                                                    | 65.2 MB                             | 63.7                                              |
| [B1.5] Insert N words at random positions (parseTime)                    | 62 ms                             | 3740 ms                                             | 6475 ms                                                    | 645 ms                              | 725 ms                                            |
| [B1.6] Insert string, then delete it (time)                              | 10 ms                             | 2292 ms                                             | 27346 ms                                                   | 162 ms                              | 24 ms                                             |
| [B1.6] Insert string, then delete it (avgUpdateSize)                     | 6053 bytes                        | 1412719 bytes                                       | 413992 bytes                                               | 7259 bytes                          | 7135 bytes                                        |
| [B1.6] Insert string, then delete it (docSize)                           | 38 bytes                          | 1497051 bytes                                       | 240035 bytes                                               | 5071 bytes                          | 4966 bytes                                        |
| [B1.6] Insert string, then delete it (memUsed)                           | 0 B                               | 37.3 MB                                             | 0 B                                                        | 0 B                                 | 0 B                                               |
| [B1.6] Insert string, then delete it (parseTime)                         | 24 ms                             | 296 ms                                              | 57 ms                                                      | 21 ms                               | 47 ms                                             |
| [B1.7] Insert/Delete strings at random positions (time)                  | 316 ms                            | 4104 ms                                             | 206696 ms                                                  | 6820 ms                             | 5436 ms                                           |
| [B1.7] Insert/Delete strings at random positions (avgUpdateSize)         | 31 bytes                          | 1100 bytes                                          | 194 bytes                                                  | 649 bytes                           | 645 bytes                                         |
| [B1.7] Insert/Delete strings at random positions (docSize)               | 28377 bytes                       | 7077396 bytes                                       | 687083 bytes                                               | 7605 bytes                          | 7497 bytes                                        |
| [B1.7] Insert/Delete strings at random positions (memUsed)               | 4.3 MB                            | 162.3 MB                                            | 8.8 MB                                                     | 76.7 MB                             | 65.2 MB                                           |
| [B1.7] Insert/Delete strings at random positions (parseTime)             | 40 ms                             | 1916 ms                                             | 1379 ms                                                    | 860 ms                              | 931 ms                                            |
| [B1.8] Append N numbers (time)                                           | 284 ms                            | 2158 ms                                             | 8503 ms                                                    | 3526 ms                             | 2316 ms                                           |
| [B1.8] Append N numbers (avgUpdateSize)                                  | 32 bytes                          | 333 bytes                                           | 48 bytes                                                   | 602 bytes                           | 594 bytes                                         |
| [B1.8] Append N numbers (docSize)                                        | 35636 bytes                       | 2200671 bytes                                       | 204029 bytes                                               | 67960 bytes                         | 67852 bytes                                       |
| [B1.8] Append N numbers (memUsed)                                        | 0 B                               | 73.5 MB                                             | 2.2 MB                                                     | 53.2 MB                             | 52.6 MB                                           |
| [B1.8] Append N numbers (parseTime)                                      | 24 ms                             | 596 ms                                              | 42 ms                                                      | 441 ms                              | 606 ms                                            |
| [B1.9] Insert Array of N numbers (time)                                  | 15 ms                             | 2935 ms                                             | 8674 ms                                                    | 171 ms                              | 40 ms                                             |
| [B1.9] Insert Array of N numbers (avgUpdateSize)                         | 35659 bytes                       | 1523692 bytes                                       | 48 bytes                                                   | 63610 bytes                         | 63548 bytes                                       |
| [B1.9] Insert Array of N numbers (docSize)                               | 35659 bytes                       | 1608025 bytes                                       | 204031 bytes                                               | 68099 bytes                         | 67994 bytes                                       |
| [B1.9] Insert Array of N numbers (memUsed)                               | 0 B                               | 51.5 MB                                             | 2 MB                                                       | 0 B                                 | 452.4 KB                                          |
| [B1.9] Insert Array of N numbers (parseTime)                             | 23 ms                             | 465 ms                                              | 45 ms                                                      | 29 ms                               | 61 ms                                             |
| [B1.10] Prepend N numbers (time)                                         | 225 ms                            | 62245 ms                                            | 7395 ms                                                    | 3375 ms                             | 2256 ms                                           |
| [B1.10] Prepend N numbers (avgUpdateSize)                                | 32 bytes                          | 297 bytes                                           | 40 bytes                                                   | 612 bytes                           | 591 bytes                                         |
| [B1.10] Prepend N numbers (docSize)                                      | 35667 bytes                       | 1985881 bytes                                       | 204031 bytes                                               | 68027 bytes                         | 67919 bytes                                       |
| [B1.10] Prepend N numbers (memUsed)                                      | 6.7 MB                            | 65.6 MB                                             | 2.2 MB                                                     | 64.7 MB                             | 52.8 MB                                           |
| [B1.10] Prepend N numbers (parseTime)                                    | 32 ms                             | 60684 ms                                            | 700 ms                                                     | 456 ms                              | 572 ms                                            |
| [B1.11] Insert N numbers at random positions (time)                      | 258 ms                            | 2600 ms                                             | 8305 ms                                                    | 3565 ms                             | 2215 ms                                           |
| [B1.11] Insert N numbers at random positions (avgUpdateSize)             | 34 bytes                          | 332 bytes                                           | 48 bytes                                                   | 620 bytes                           | 593 bytes                                         |
| [B1.11] Insert N numbers at random positions (docSize)                   | 59139 bytes                       | 2198225 bytes                                       | 204029 bytes                                               | 67985 bytes                         | 67877 bytes                                       |
| [B1.11] Insert N numbers at random positions (memUsed)                   | 0 B                               | 70 MB                                               | 2.2 MB                                                     | 52.7 MB                             | 51.9 MB                                           |
| [B1.11] Insert N numbers at random positions (parseTime)                 | 42 ms                             | 739 ms                                              | 616 ms                                                     | 495 ms                              | 605 ms                                            |
| [B2.1] Concurrently insert string of length N at index 0 (time)          | 5 ms                              | 5930 ms                                             | 35048 ms                                                   | 2 ms                                | 29 ms                                             |
| [B2.1] Concurrently insert string of length N at index 0 (updateSize)    | 12058 bytes                       | 2970726 bytes                                       | 551984 bytes                                               | 13195 bytes                         | 13125 bytes                                       |
| [B2.1] Concurrently insert string of length N at index 0 (docSize)       | 12151 bytes                       | 3164619 bytes                                       | 375131 bytes                                               | 17193 bytes                         | 17088 bytes                                       |
| [B2.1] Concurrently insert string of length N at index 0 (memUsed)       | 0 B                               | 107 MB                                              | 3.7 MB                                                     | 0 B                                 | 0 B                                               |
| [B2.1] Concurrently insert string of length N at index 0 (parseTime)     | 21 ms                             | 841 ms                                              | 75 ms                                                      | 23 ms                               | 58 ms                                             |
| [B2.2] Concurrently insert N characters at random positions (time)       | 126 ms                            | 56410 ms                                            | 34593 ms                                                   | 7060 ms                             | 2374 ms                                           |
| [B2.2] Concurrently insert N characters at random positions (updateSize) | 66250 bytes                       | 2753309 bytes                                       | 551952 bytes                                               | 7339498 bytes                       | 6883904 bytes                                     |
| [B2.2] Concurrently insert N characters at random positions (docSize)    | 66351 bytes                       | 2947202 bytes                                       | 375131 bytes                                               | 17204 bytes                         | 17099 bytes                                       |
| [B2.2] Concurrently insert N characters at random positions (memUsed)    | 7.4 MB                            | 97.5 MB                                             | 4 MB                                                       | 123.7 MB                            | 98.5 MB                                           |
| [B2.2] Concurrently insert N characters at random positions (parseTime)  | 53 ms                             | 63302 ms                                            | 2197 ms                                                    | 880 ms                              | 1004 ms                                           |
| [B2.3] Concurrently insert N words at random positions (time)            | 207 ms                            | 298833 ms                                           | 2421070 ms                                                 | 7148 ms                             | 2376 ms                                           |
| [B2.3] Concurrently insert N words at random positions (updateSize)      | 177626 bytes                      | 17694557 bytes                                      | 3295508 bytes                                              | 7356056 bytes                       | 6948149 bytes                                     |
| [B2.3] Concurrently insert N words at random positions (docSize)         | 177768 bytes                      | 18723438 bytes                                      | 2224037 bytes                                              | 76846 bytes                         | 76741                                             |
| [B2.3] Concurrently insert N words at random positions (memUsed)         | 16.9 MB                           | 617.9 MB                                            | 39.4 MB                                                    | 135.6 MB                            | 114.2 MB                                          |
| [B2.3] Concurrently insert N words at random positions (parseTime)       | 112 ms                            | 101113 ms                                           | 26880 ms                                                   | 1012 ms                             | 971 ms                                            |
| [B2.4] Concurrently insert & delete (time)                               | 435 ms                            | 525324 ms                                           | 2973492 ms                                                 | 24240 ms                            | 5920 ms                                           |
| [B2.4] Concurrently insert & delete (updateSize)                         | 278576 bytes                      | 26581955 bytes                                      | 5560833 bytes                                              | 14763970 bytes                      | 13936410 bytes                                    |
| [B2.4] Concurrently insert & delete (docSize)                            | 278719 bytes                      | 28114528 bytes                                      | 3607278 bytes                                              | 82223 bytes                         | 82223 bytes                                       |
| [B2.4] Concurrently insert & delete (memUsed)                            | 29.2 MB                           | 846.8 MB                                            | 35 MB                                                      | 248.8 MB                            | 225.5 MB                                          |
| [B2.4] Concurrently insert & delete (parseTime)                          | 265 ms                            | 9865 ms                                             | 43212 ms                                                   | 2325 ms                             | 2502 ms                                           |
| [B3.1] 500 clients concurrently set number in Map (time)                 | 80 ms                             | 530 ms                                              |                                                            | 699 ms                              | 1041 ms                                           |
| [B3.1] 500 clients concurrently set number in Map (updateSize)           | 15915 bytes                       | 79890 bytes                                         |                                                            | 4071455 bytes                       | 150547 ms                                         |
| [B3.1] 500 clients concurrently set number in Map (docSize)              | 10460 bytes                       | 93402 bytes                                         |                                                            | 4583 bytes                          | 4475 bytes                                        |
| [B3.1] 500 clients concurrently set number in Map (memUsed)              | 1.9 MB                            | 8.5 MB                                              |                                                            | 131.7 MB                            | 202.8 MB                                          |
| [B3.1] 500 clients concurrently set number in Map (parseTime)            | 238 ms                            | 599 ms                                              |                                                            | 305 ms                              | 425 ms                                            |
| [B3.2] 500 clients concurrently set Object in Map (time)                 | 102 ms                            | 911 ms                                              |                                                            | 760 ms                              | 1287 ms                                           |
| [B3.2] 500 clients concurrently set Object in Map (updateSize)           | 30874 bytes                       | 221890 bytes                                        |                                                            | 4078418 bytes                       | 157542 bytes                                      |
| [B3.2] 500 clients concurrently set Object in Map (docSize)              | 13494 bytes                       | 245902 bytes                                        |                                                            | 4619 bytes                          | 4616 bytes                                        |
| [B3.2] 500 clients concurrently set Object in Map (memUsed)              | 0 B                               | 16.9 MB                                             |                                                            | 130.6 MB                            | 200.5 MB                                          |
| [B3.2] 500 clients concurrently set Object in Map (parseTime)            | 239 ms                            | 853 ms                                              |                                                            | 299 ms                              | 414 ms                                            |
| [B3.3] 500 clients concurrently set String in Map (time)                 | 111 ms                            | 709 ms                                              |                                                            | 794 ms                              | 1453 ms                                           |
| [B3.3] 500 clients concurrently set String in Map (updateSize)           | 710982 bytes                      | 774500 bytes                                        |                                                            | 4231288 bytes                       | 310375 bytes                                      |
| [B3.3] 500 clients concurrently set String in Map (docSize)              | 11967 bytes                       | 788012 bytes                                        |                                                            | 4833 bytes                          | 4833 bytes                                        |
| [B3.3] 500 clients concurrently set String in Map (memUsed)              | 0 B                               | 11.7 MB                                             |                                                            | 131.1 MB                            | 239.1 MB                                          |
| [B3.3] 500 clients concurrently set String in Map (parseTime)            | 243 ms                            | 791 ms                                              |                                                            | 302 ms                              | 424 ms                                            |
| [B3.4] 500 clients concurrently insert text in Array (time)              | 102 ms                            | 1962 ms                                             | 143 ms                                                     | 23839 ms                            | 5662 ms                                           |
| [B3.4] 500 clients concurrently insert text in Array (updateSize)        | 16880 bytes                       | 161850 bytes                                        | 19890 bytes                                                | 4066825 bytes                       | 145996 bytes                                      |
| [B3.4] 500 clients concurrently insert text in Array (docSize)           | 8405 bytes                        | 179163 bytes                                        | 16417 bytes                                                | 7022 bytes                          | 6915 bytes                                        |
| [B3.4] 500 clients concurrently insert text in Array (memUsed)           | 0 B                               | 16.7 MB                                             | 1.5 MB                                                     | 552.1 MB                            | 414.6 MB                                          |
| [B3.4] 500 clients concurrently insert text in Array (parseTime)         | 239 ms                            | 3848 ms                                             | 376 ms                                                     | 479 ms                              | 524 ms                                            |
| [B4] Apply real-world editing dataset (time)                             | 6766 ms                           | 374011 ms                                           | 26297824 ms                                                | 3814038 ms                          | 37086 ms                                          |
| [B4] Apply real-world editing dataset (avgUpdateSize)                    | 29 bytes                          | 291 bytes                                           | 45 bytes                                                   | 587 bytes                           | 588 bytes                                         |
| [B4] Apply real-world editing dataset (encodeTime)                       | 29 ms                             | 2494 ms                                             | 922 ms                                                     |                                     |                                                   |
| [B4] Apply real-world editing dataset (docSize)                          | 159929 bytes                      | 83966886 bytes                                      | 7888799 bytes                                              | 127041 bytes                        | 127041 bytes                                      |
| [B4] Apply real-world editing dataset (memUsed)                          | 2.6 MB                            | 0 B                                                 | 34.4 MB                                                    | 760.7 MB                            | 355.4 MB                                          |
| [B4] Apply real-world editing dataset (parseTime)                        | 514 ms                            | 29507 ms                                            | 73350 ms                                                   | 34570 ms                            | 41669 ms                                          |
| [B4 x 100] Apply real-world editing dataset 100 times (time)             | 177123 ms                         |                                                     |                                                            |                                     |                                                   |
| [B4 x 100] Apply real-world editing dataset 100 times (encodeTime)       | 589 ms                            |                                                     |                                                            |                                     |                                                   |
| [B4 x 100] Apply real-world editing dataset 100 times (docSize)          | 15989245 bytes                    |                                                     |                                                            |                                     |                                                   |
| [B4 x 100] Apply real-world editing dataset 100 times (parseTime)        | 1871 ms                           |                                                     |                                                            |                                     |                                                   |
| [B4 x 100] Apply real-world editing dataset 100 times (memUsed)          | 266.9 MB                          |                                                     |                                                            |                                     |                                                   |

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
