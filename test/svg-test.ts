// =============================================================================
// Euclid.js | SVG Tests
// (c) Mathigon
// =============================================================================


import tape from 'tape';
import {drawSVG, Point, Polygon} from '../src';


const poly = (...p: number[][]) => new Polygon(...p.map(q => new Point(q[0], q[1])));


tape('Rounded Polygons', (test) => {
  const p1 = poly([0, 0], [5, 0], [5, 5], [0, 5]);
  const path = drawSVG(p1, {cornerRadius: 1});
  test.equal(path, 'M1 0L4.00 0.00C4.55 0.00 5.00 0.45 5.00 1.00L5.00 4.00C5.00 4.55 4.55 5.00 4.00 5.00L1.00 5.00C0.45 5.00 0.00 4.55 0.00 4.00L0.00 1.00C0.00 0.45 0.45 0.00 1.00 0.00');

  test.end();
});
