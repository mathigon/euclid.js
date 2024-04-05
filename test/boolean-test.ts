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
  const t1 = new Polygon(new Point(630.64, 783.64), new Point(655.64, 826.941270189222), new Point(680.64, 783.64));
  const t2 = new Polygon(new Point(630.64, 783.6412701892219), new Point(655.64, 740.34), new Point(680.64, 783.6412701892219));
  const i1 = Polygon.intersection([t1, t2], undefined, true);
  test.equal(i1.length, 0);

  // Minimally overlapping rhombus
  const rhom1 = new Polygon(new Point(364.20573225037634, 762.5778998441511), new Point(393.594994865, 803.0287495628985), new Point(347.91772198287, 782.6919174091084), new Point(318.52845936824633, 742.2410676903611));
  const rhom2 = new Polygon(new Point(350.29712442218573, 828.024401212054), new Point(300.29712442218573, 828.024401212054), new Point(343.5983946114076, 803.024401212054), new Point(393.5983946114076, 803.024401212054));
  const i2 = Polygon.intersection([rhom1, rhom2], undefined, true);
  test.equal(i2[0].area < .1, true);

  // Mostly overlapping rhombus
  const rhom3 = new Polygon(new Point(391.08895330967306, 854.8726448020227), new Point(393.7057511218203, 804.941168064294), new Point(416.40527610879764, 849.4914942737123), new Point(413.7884782966504, 899.4229710114411));
  const rhom4 = new Polygon(new Point(390.9815967992604, 852.9558779497828), new Point(393.5983946114076, 803.024401212054), new Point(416.29791959838496, 847.5747274214724), new Point(413.6811217862377, 897.5062041592012));
  const i3 = Polygon.intersection([rhom3, rhom4], undefined, true);
  test.equal(i3.length, 1);

  test.end();
});

tape('unions', (test) => {
  // In some configurations this throws a zero segment error.
  const u1 = new Polygon(new Point(1622.9, 534.7), new Point(1522.9, 534.7), new Point(1547.9, 578), new Point(1597.9, 578));
  const u2 = new Polygon(new Point(1398.71, 552.1512701892219), new Point(1448.71, 552.1512701892219), new Point(1423.71, 508.85));
  const u3 = new Polygon(new Point(1448.71, 552.1487298107781), new Point(1398.71, 552.1487298107781), new Point(1423.71, 595.45));
  const union = Polygon.union([u1, u2, u3], undefined, true);
  test.equal(Math.abs(total(union.map(u => u.area)) - (u1.area + u2.area + u3.area)) < 1, true);

  // if you change useRound to true on this union it will produce a zero segment error.
  const polyList = [
    new Polygon(new Point(1167.2641162274222, 3633.834721294776), new Point(1342.2641162274222, 3330.7258299702225), new Point(1167.2641162274222, 3330.7258299702225), new Point(1079.7641162274222, 3482.2802756324995)),
    new Polygon(new Point(1692.26, 3936.95), new Point(1342.26, 3936.94), new Point(1254.76, 4088.49), new Point(1079.76, 4088.49), new Point(992.26, 3936.94), new Point(992.27, 3936.94), new Point(1167.26, 3633.83), new Point(1167.2636603221083, 3633.8336603221082), new Point(1342.26, 3330.74), new Point(1517.2542265184259, 3633.84), new Point(1692.26, 3633.84), new Point(1779.76, 3785.39))
  ];
  const badUnion = Polygon.union(polyList, undefined, false);

  test.end();
});
