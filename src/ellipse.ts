// =============================================================================
// Euclid.js | Ellipse Class
// (c) Mathigon
// =============================================================================


import {quadratic} from '@mathigon/fermat';
import {Angle} from './angle';
import {Line} from './line';
import {ORIGIN, Point} from './point';
import {GeoShape, TransformMatrix, TWO_PI} from './utilities';


export class Ellipse implements GeoShape {
  readonly type = 'ellipse';
  readonly f1: Point;
  readonly f2: Point;

  constructor(readonly c: Point, readonly a: number, readonly b: number) {
    // TODO Support vertical and rotated ellipses
    if (a < b) throw new Error('Vertical ellipses not supported.');
    const f = Math.sqrt(a ** 2 - b ** 2);  // Distance from focus to the center.
    this.f1 = c.shift(-f, 0);
    this.f2 = c.shift(f, 0);
  }

  normalAt(p: Point) {
    const a = new Angle(this.f1, p, this.f2);
    return a.bisector!;
  }

  /** Intersection between an ellipse and a line. */
  intersect(line: Line) {
    const dx = line.p1.x - line.p2.x;
    const dy = line.p1.y - line.p2.y;

    const px = this.c.x - line.p1.x;
    const py = this.c.y - line.p1.y;

    const A = (dx / this.a) ** 2 + (dy / this.b) ** 2;
    const B = 2 * px * dx / (this.a) ** 2 + 2 * py * dy / (this.b) ** 2;
    const C = (px / this.a) ** 2 + (py / this.b) ** 2 - 1;

    const points = quadratic(A, B, C);
    return points.map(t => line.at(t));
  }

  /**
   * Creates a new Ellipse. StringLength is the length of string from one foci
   * to a point on the circumference, to the other foci.
   */
  static fromFoci(f1: Point, f2: Point, stringLength: number) {
    const c = Point.distance(f1, f2) / 2;  // Half distance between foci.
    const a = stringLength / 2;
    const b = Math.sqrt(a ** 2 - c ** 2);
    return new Ellipse(Point.interpolate(f1, f2), a, b);
  }

  // ---------------------------------------------------------------------------

  project(p: Point) {
    const [a, b] = [this.a, this.b];
    const th = p.angle(this.c);
    const k = a * b / Math.sqrt((b * Math.cos(th)) ** 2 + (a * Math.sin(th)) ** 2);
    return new Point(k * Math.cos(th), k * Math.sin(th));
  }

  at(t: number) {
    const th = TWO_PI * t;
    return this.c.shift(this.a * Math.cos(th), this.b * Math.sin(th));
  }

  contains(_p: Point) {
    // TODO Implement
    return false;
  }

  // ---------------------------------------------------------------------------

  transform(_m: TransformMatrix): this {
    // TODO Implement
    return this;
  }

  rotate(_a: number, _c = ORIGIN): this {
    // TODO Implement
    return this;
  }

  reflect(_l: Line): this {
    // TODO Implement
    return this;
  }

  scale(_sx: number, _sy = _sx): this {
    // TODO Implement
    return this;
  }

  shift(_x: number, _y = _x): this {
    // TODO Implement
    return this;
  }

  translate(_p: Point) {
    // TODO Implement
    return this;
  }

  equals() {
    // TODO Implement
    return false;
  }

  toString() {
    return `ellipse(${this.c},${this.a},${this.b})`;
  }
}
