// =============================================================================
// Euclid.js | Polygon Tests
// (c) Mathigon
// =============================================================================


import {nearlyEquals} from '@mathigon/fermat';
import tape from 'tape';
import {Line, Point, Segment} from '../src';


tape('offset and projections', (test) => {
  const a = new Point(0, 0);
  const b = new Point(1, 1);
  const c = new Point(2, 2);
  const d = new Point(2, 0);
  const e = new Point(0, 2);
  const line = new Line(a, c);

  test.true(line.at(0.5).equals(b));
  test.true(nearlyEquals(line.offset(b), 0.5));

  test.true(line.project(d).equals(b));
  test.true(line.project(a).equals(a));

  test.true(line.contains(b));
  test.false(line.contains(d));

  test.equals(line.side(d), 1);
  test.equals(line.side(b), 0);
  test.equals(line.side(e), -1);

  test.end();
});

tape('line intercepts', (test) => {
  const line1 = new Line(new Point(1, 1), new Point(2, 2));
  test.equals(line1.intercept, 0);

  const line2 = new Line(new Point(0, 3), new Point(2, 1));
  test.equals(line2.intercept, 3);

  test.end();
});

tape('segment part', (test) => {
  const a = new Segment(new Point(1, 1), new Point(2, 2));
  const b = a.part(0.25, 0.75);
  test.true(b.p1.equals(new Point(1.25, 1.25)));
  test.true(b.p2.equals(new Point(1.75, 1.75)));

  test.end();
});

