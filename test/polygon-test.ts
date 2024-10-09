// =============================================================================
// Euclid.js | Polygon Tests
// (c) Mathigon
// =============================================================================

import tape from 'tape';
import {Point, Polygon, Polyline, Rectangle} from '../src';

const poly = (...p: number[][]) => new Polygon(...p.map((q) => new Point(q[0], q[1])));

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

tape('Collision and Equals', (test) => {
  const rect = new Rectangle(new Point(0, 0), 1);
  const shape = poly([0, 0], [0, 1], [1, 1], [1, 0]);
  test.equal(Polygon.collision(rect.polygon, shape), true);
  test.equal(rect.equals(shape), true);
  test.end();
});
