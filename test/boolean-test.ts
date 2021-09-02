// =============================================================================
// Euclid.js | Boolean Operations Tests
// (c) Mathigon
// =============================================================================


import tape from 'tape';
import {difference, intersect, union, xor} from '../src/boolean';
import {Point} from '../src';


const poly = (...p: number[][]) => p.map(q => new Point(q[0], q[1]));
const points = (p: Point[][]) => p.map(q => q.map(r => r.array));

tape('boolean operations', (test) => {
  const p1 = poly([0, 0], [2, 0], [2, 2], [0, 2]);
  const p2 = poly([1, 1], [3, 1], [3, 3], [1, 3]);

  const r1 = points(union([p1], [p2]));
  test.deepEquals(r1, [[[3, 3], [3, 1], [2, 1], [2, 0], [0, 0], [0, 2], [1, 2], [1, 3]]]);

  const r2 = points(intersect([p1], [p2]));
  test.deepEquals(r2, [[[2, 2], [2, 1], [1, 1], [1, 2]]]);

  const r3 = points(difference([p1], [p2]));
  const a = [[2, 1], [2, 0], [0, 0], [0, 2], [1, 2], [1, 1]];
  test.deepEquals(r3, [a]);

  const r4 = points(xor([p1], [p2]));
  test.deepEquals(r4, [a, [[3, 3], [3, 1], [2, 1], [2, 2], [1, 2], [1, 3]]]);

  test.end();
});

tape('compound polygons', (test) => {
  const p1 = poly([50, 50], [150, 150], [190, 50]);
  const p2 = poly([130, 50], [290, 150], [290, 50]);
  const p3 = poly([110, 20], [110, 110], [20, 20]);
  const p4 = poly([130, 170], [130, 20], [260, 20], [260, 170]);

  const r = points(intersect([p1, p2], [p3, p4]));
  test.deepEquals(r, [
    [[50, 50], [110, 50], [110, 110]],
    [[178, 80], [130, 50], [130, 130], [150, 150]],
    [[178, 80], [190, 50], [260, 50], [260, 131.25]]
  ]);

  test.end();
});
