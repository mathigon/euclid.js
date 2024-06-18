// =============================================================================
// Euclid.js | Polygon Tests
// (c) Mathigon
// =============================================================================


import tape from 'tape';
import {drawSVG, Line, Point, Polygon, Polyline} from '../src';


const poly = (...p: number[][]) => new Polygon(...p.map(q => new Point(q[0], q[1])));


tape('Rounded Polygons', (test) => {
  const p1 = poly([0, 0], [0, 5], [5, 5], [5, 0]);
  const path = drawSVG(p1, {cornerRadius: 1});
  test.equal(path, 'M123Z');

  test.end();
});
