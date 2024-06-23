// =============================================================================
// Euclid.js | SVG Tests
// (c) Mathigon
// =============================================================================


import tape from 'tape';
import {drawSVG, Point, Polygon} from '../src';


const poly = (...p: number[][]) => new Polygon(...p.map(q => new Point(q[0], q[1])));


tape('Rounded Polygons', (test) => {
  const p1 = poly([0, 0], [5, 0], [5, 5], [0, 5]);
  const path = drawSVG(p1, {cornerRadius: 1}).replace(/(\.\d\d)\d+/g, '$1');
  test.equal(path, 'M1 0L4 0C4.55 0 5 0.44 5 1L5 4C5 4.55 4.55 5 4 5L1 5C0.44 5 0 4.55 0 4L0 1C0 0.44 0.44 0 1 0');

  test.end();
});
