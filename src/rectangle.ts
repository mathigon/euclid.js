// =============================================================================
// Euclid.js | Reactangle Class
// (c) Mathigon
// =============================================================================


import {isBetween, nearlyEquals} from '@mathigon/fermat';
import {toRad} from './angle';
import {Line} from './line';
import {ORIGIN, Point} from './point';
import {Polygon} from './polygon';
import {GeoShape, SimplePoint, TransformMatrix} from './utilities';


/** A rectangle, defined by its top left vertex, width and height. */
export class Rectangle implements GeoShape {
  readonly type = 'rectangle';

  constructor(readonly p: Point, readonly w = 1, readonly h = w) {}

  /** Creates the smallest rectangle containing all given points. */
  static aroundPoints(points: Iterable<SimplePoint>) {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    for (const p of points) {
      xMin = xMin < p.x ? xMin : p.x;
      xMax = xMax > p.x ? xMax : p.x;
      yMin = yMin < p.y ? yMin : p.y;
      yMax = yMax > p.y ? yMax : p.y;
    }

    return new Rectangle(new Point(xMin, yMin), xMax - xMin, yMax - yMin);
  }

  get center() {
    return new Point(this.p.x + this.w / 2, this.p.y + this.h / 2);
  }

  get centroid() {
    return this.center;
  }

  get circumference() {
    return 2 * Math.abs(this.w) + 2 * Math.abs(this.h);
  }

  get area() {
    return Math.abs(this.w * this.h);
  }

  /** @returns {Segment[]} */
  get edges() {
    return this.polygon.edges;
  }

  /** @returns {Point[]} */
  get points() {
    return this.polygon.points;
  }

  /** A polygon class representing this rectangle. */
  get polygon() {
    const b = new Point(this.p.x + this.w, this.p.y);
    const c = new Point(this.p.x + this.w, this.p.y + this.h);
    const d = new Point(this.p.x, this.p.y + this.h);
    return new Polygon(this.p, b, c, d);
  }

  collision(r: Rectangle) {
    return (this.p.x < r.p.x + r.w && this.p.x + this.w > r.p.x &&
            this.p.y < r.p.y + r.h && this.p.y + this.h > r.p.y);
  }

  // ---------------------------------------------------------------------------

  contains(p: Point, tolerance?: number) {
    return isBetween(p.x, this.p.x, this.p.x + this.w, tolerance) &&
           isBetween(p.y, this.p.y, this.p.y + this.h, tolerance);
  }

  project(p: SimplePoint): Point {
    let q: Point|undefined = undefined;

    for (const e of this.edges) {
      const q1 = e.project(p);
      if (!q || Point.distance(p, q1) < Point.distance(p, q)) q = q1;
    }

    return q!;
  }

  at(_t: number) {
    // TODO Implement
    return this.p;
  }

  // ---------------------------------------------------------------------------

  transform(m: TransformMatrix) {
    return this.polygon.transform(m);
  }

  /** Rotates this rectangle by a given angle (in radians), optionally around point `center`. */
  rotate(angle: number, center?: SimplePoint) {
    return this.rotateRad(angle, center);
  }

  /** Rotates this rectangle by a given angle (in radians), optionally around point `center`. */
  rotateRad(radians: number, center: SimplePoint = ORIGIN) {
    if (nearlyEquals(radians, 0)) return this;
    return this.polygon.rotate(radians, center);
  }

  /** Rotates this rectangle by a given angle (in degrees), optionally around point `center`. */
  rotateDeg(degrees: number, center?: SimplePoint) {
    return this.rotateRad(toRad(degrees), center);
  }

  reflect(l: Line) {
    return this.polygon.reflect(l);
  }

  scale(sx: number, sy = sx) {
    return new Rectangle(this.p.scale(sx, sy), this.w * sx, this.h * sy);
  }

  shift(x: number, y = x) {
    return new Rectangle(this.p.shift(x, y), this.w, this.h);
  }

  translate(p: Point) {
    return this.shift(p.x, p.y);
  }

  equals(_other: Polygon) {
    // TODO Implement
    return false;
  }
}
