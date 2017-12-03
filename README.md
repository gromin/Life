= Life

A simple implementation of Conway's Life. Written with react and typescript.

== State and ticks

1) Board is infinte in every direction, cell coordinates are counted from [0, 0] and can be negative
2) Field = Two-dimensional map (object of objects) with each living cell, represented as `Field[x][y]`
3) Function `tick` takes `field` and returns `nextField`
4) `tick` function takes every living cell and its dead neighbours (not marked as already computed), computes new states for each one (and marks dead neighbours as computed)

== Visualizing & Control

Life's view is presented as fixed 30x20 grid, initially centered around cell [0, 0]. There is buttons to pan visible area in every direction and re-center visible area back to cell [0, 0].

You can use 'pause' and 'play' buttons to stop or fast-forward current state. In 'pause' mode you can step manually forward. Animation speed is 4fps and fixed.

== Persistent store

There is possibility to save current state to file as ascii string of all living cells. This file is readable back by program to seed initial state.

== TODO

* Implement panning
* Implement 
* Optimize Field's DOM representation
* Implement app's state through redux's store
* Implement field's manipulation functions as reducers over redux's store
