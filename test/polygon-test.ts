// =============================================================================
// Euclid.js | Polygon Tests
// (c) Mathigon
// =============================================================================


import * as tape from 'tape';
import {Point} from '../src/point';
import {Polygon, Polyline} from '../src/polygon';


tape('length and circumference', (test) => {
  const p1 = new Polygon(new Point(0, 0), new Point(0, 1), new Point(1, 1), new Point(1, 0));
  test.equal(p1.circumference, 4);

  const p2 = new Polyline(new Point(0, 0), new Point(0, 1), new Point(1, 1), new Point(1, 0));
  test.equal(p2.length, 3);

  test.end();
});
