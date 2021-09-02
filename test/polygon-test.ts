// =============================================================================
// Euclid.js | Polygon Tests
// (c) Mathigon
// =============================================================================


import tape from 'tape';
import {Line, Point, Polygon, Polyline} from '../src';


const poly = (...p: number[][]) => new Polygon(...p.map(q => new Point(q[0], q[1])));
const line = (...p: number[][]) => new Line(new Point(p[0][0], p[0][1]), new Point(p[1][0], p[1][1]));
const points = (p: Polygon) => p.points.map(q => q.array);


tape('Length and Circumference', (test) => {
  const p1 = poly([0, 0], [0, 1], [1, 1], [1, 0]);
  test.equal(p1.circumference, 4);

  const p2 = new Polyline(...poly([0, 0], [0, 1], [1, 1], [1, 0]).points);
  test.equal(p2.length, 3);

  test.end();
});

tape('Convex Hull', (test) => {
  const points = poly([0, 0], [0, 1], [0, 2], [1, -1], [-1, -1]).points;
  const hull = Polygon.convexHull(...points);

  test.deepEquals(hull.points.length, 3);
  test.deepEquals(hull.points[0], points[4]);
  test.deepEquals(hull.points[1], points[2]);
  test.deepEquals(hull.points[2], points[3]);

  test.end();
});

tape('Cutting', (test) => {
  const shape = poly([0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2]);

  const c1 = shape.cut(line([1, 0], [1, 1])).map(p => points(p));
  test.deepEquals(c1, [[[2, 1], [2, 0], [1, 0], [1, 1]], [[1, 2], [1, 0], [0, 0], [0, 2]]]);

  const c2 = shape.cut(line([-1, 1], [0, 1])).map(p => points(p));
  test.deepEquals(c2, [[[2, 1], [2, 0], [0, 0], [0, 1]], [[1, 2], [1, 1], [0, 1], [0, 2]]]);

  const c3 = shape.cut(line([0, 0], [1, 1])).map(p => points(p));
  test.deepEquals(c3, [[[2, 1], [2, 0], [0, 0], [1, 1]], [[1, 2], [1, 1], [0, 0], [0, 2]]]);

  const c4 = shape.cut(line([0, 2], [2, 0])).map(p => points(p));
  test.deepEquals(c4, [[[2, 0], [0, 0], [0, 2]], [[0, 2], [1, 1], [1, 2]], [[1, 1], [2, 0], [2, 1]]]);

  test.end();
});
