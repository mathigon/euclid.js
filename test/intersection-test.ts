// =============================================================================
// Euclid.js | Intersection Tests
// (c) Mathigon
// =============================================================================


import tape from 'tape';
import {Circle, intersections, Line, Point, Polygon, Ray, Rectangle, Segment} from '../src';


tape('segment-segment intersection', (test) => {
  const s1 = new Segment(new Point(1, 1), new Point(3, 1));
  const s2 = new Segment(new Point(2, 2), new Point(2, 0));
  const res = intersections(s1, s2);
  test.equal(res.length, 1);
  test.deepEqual([res[0].x, res[0].y], [2, 1]);
  test.end();
});

tape('polygon-polygon intersection', (test) => {
  const p1 = new Polygon(new Point(0, 0), new Point(0, 2), new Point(2, 2), new Point(2, 0));
  const p2 = new Polygon(new Point(1, 1), new Point(3, 1), new Point(3, 3), new Point(1, 3));
  const res = intersections(p1, p2);
  test.equal(res.length, 2);
  test.deepEqual([res[0].x, res[0].y, res[1].x, res[1].y], [2, 1, 1, 2]);
  test.end();
});

tape('circle-circle intersection', (test) => {
  const c1 = new Circle(new Point(1, 0), 2);
  const c2 = new Circle(new Point(-1, 0), 2);
  const res = intersections(c1, c2);
  test.equal(res.length, 2);
  test.deepEqual([res[0].x, res[1].x], [0, 0]);
  test.end();
});

tape('polygon-line intersection', (test) => {
  const p1 = new Polygon(new Point(0, 0), new Point(0, 2), new Point(2, 2), new Point(2, 0));
  const l1 = new Line(new Point(0, 3), new Point(1, 2));
  const res = intersections(l1, p1);
  test.equal(res.length, 2);
  test.deepEqual([res[0].x, res[0].y, res[1].x, res[1].y], [1, 2, 2, 1]);

  const p2 = new Polygon(new Point(0, 0), new Point(100, 0), new Point(100, 100), new Point(0, 100), new Point(0, 50));
  const ray = new Ray(new Point(50, 50), new Point(100, 50));
  const int = intersections(p2, ray);
  test.equal(int.length, 1);
  test.deepEqual([int[0].x, int[0].y], [100, 50]);

  test.end();
});

tape('rectangle-line intersection', (test) => {
  const rect = new Rectangle(new Point(0, 0), 2, 2);
  const line = new Segment(new Point(1, 1), new Point(3, 1));

  const res = intersections(rect, line);
  test.equal(res.length, 1);
  test.deepEqual(res[0].x, 2);
  test.deepEqual(res[0].y, 1);

  test.end();
});

tape('parallel-lines', (test) => {
  // Line parallel to edge of polygon returns the vertices of the polygon
  // TODO Should this really happen?
  const p1 = new Polygon(new Point(0, 0), new Point(0, 2), new Point(2, 2), new Point(2, 0));
  const l1 = new Line(new Point(0, 2), new Point(3, 2));
  const res = intersections(p1, l1);
  test.equal(res.length, 2);
  test.end();
});

tape('single-elements', (test) => {
  // Single elements
  const s1 = new Segment(new Point(1, 1), new Point(3, 1));
  test.equal(intersections(s1).length, 0);
  test.end();
});

tape('performance', (test) => {
  // Two VERY large polygons should intersect in <1 s
  const start = Date.now();
  const p1 = Polygon.regular(100, 1);
  const p2 = Polygon.regular(101, 1);
  test.equal(intersections(p1, p2).length, 202);
  const end = Date.now();
  test.ok(end - start < 1000);
  test.end();
});
