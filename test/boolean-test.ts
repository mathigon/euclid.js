// =============================================================================
// Euclid.js | Boolean Operations Tests
// (c) Mathigon
// =============================================================================


import tape from 'tape';
import {difference, intersect, Polygon, union, xor} from '../src';
import {Point} from '../src';
import {total} from '@mathigon/core';


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

tape('intersections', (test) => {
  const hexagon = Polygon.regular(6, 100);
  const result = Polygon.intersection([hexagon, hexagon]);
  test.equal(hexagon.area, result[0].area);

  const p1 = new Polygon(new Point(340, 300), new Point(341.95, 210), new Point(360, 250));
  const p2 = new Polygon(new Point(340, 300), new Point(341.953125, 210), new Point(360, 250));
  const r2 = Polygon.intersection([p1, p2]);
  test.equal(r2.length, 1);

  // Minimally overlapping triangles
  // If useRound is false this produces a zero segment error!
  const t1 = new Polygon(new Point(630.64, 783.64), new Point(655.64, 826.941270189222), new Point(680.64, 783.64));
  const t2 = new Polygon(new Point(630.64, 783.6412701892219), new Point(655.64, 740.34), new Point(680.64, 783.6412701892219));
  const i1 = Polygon.intersection([t1, t2], undefined, true);
  test.equal(i1.length, 0);

  test.end();
});

tape('unions', (test) => {
  // if you change useRound to true on this union it will produce a zero segment error.
  const polyList = [
    new Polygon(new Point(1167.2641162274222, 3633.834721294776), new Point(1342.2641162274222, 3330.7258299702225), new Point(1167.2641162274222, 3330.7258299702225), new Point(1079.7641162274222, 3482.2802756324995)),
    new Polygon(new Point(1692.26, 3936.95), new Point(1342.26, 3936.94), new Point(1254.76, 4088.49), new Point(1079.76, 4088.49), new Point(992.26, 3936.94), new Point(992.27, 3936.94), new Point(1167.26, 3633.83), new Point(1167.2636603221083, 3633.8336603221082), new Point(1342.26, 3330.74), new Point(1517.2542265184259, 3633.84), new Point(1692.26, 3633.84), new Point(1779.76, 3785.39))
  ];
  const badUnion = Polygon.union(polyList, undefined, false);
  test.equal(Math.abs(total(badUnion.map(u => u.area)) - total(polyList.map(u => u.area))) < 1, true);

  test.end();
});
