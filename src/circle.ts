// =============================================================================
// Euclid.js | Circle Class
// (c) Mathigon
// =============================================================================


import {nearlyEquals} from '@mathigon/fermat';
import {Arc} from './arc';
import {Line} from './line';
import {ORIGIN, Point} from './point';
import {GeoShape, TransformMatrix, TWO_PI} from './utilities';


/** A circle with a given center and radius. */
export class Circle implements GeoShape {
  readonly type = 'circle';

  constructor(readonly c = ORIGIN, readonly r = 1) {}

  /** The length of the circumference of this circle. */
  get circumference() {
    return TWO_PI * this.r;
  }

  /** The area of this circle. */
  get area() {
    return Math.PI * this.r ** 2;
  }

  get arc() {
    const start = this.c.shift(this.r, 0);
    return new Arc(this.c, start, TWO_PI);
  }

  tangentAt(t: number) {
    const p1 = this.at(t);
    const p2 = this.c.rotate(Math.PI / 2, p1);
    return new Line(p1, p2);
  }

  // ---------------------------------------------------------------------------

  project(p: Point) {
    const proj = p.subtract(this.c).unitVector.scale(this.r);
    return Point.sum(this.c, proj);
  }

  at(t: number) {
    const a = 2 * Math.PI * t;
    return this.c.shift(this.r * Math.cos(a), this.r * Math.sin(a));
  }

  contains(p: Point) {
    return Point.distance(p, this.c) <= this.r;
  }

  // ---------------------------------------------------------------------------

  transform(m: TransformMatrix) {
    const scale = Math.abs(m[0][0]) + Math.abs(m[1][1]);
    return new Circle(this.c.transform(m), this.r * scale / 2);
  }

  rotate(a: number, c = ORIGIN) {
    return new Circle(this.c.rotate(a, c), this.r);
  }

  reflect(l: Line) {
    return new Circle(this.c.reflect(l), this.r);
  }

  scale(sx: number, sy = sx) {
    return new Circle(this.c.scale(sx, sy), this.r * (sx + sy) / 2);
  }

  shift(x: number, y = x) {
    return new Circle(this.c.shift(x, y), this.r);
  }

  translate(p: Point) {
    return this.shift(p.x, p.y);
  }

  equals(other: Circle) {
    return nearlyEquals(this.r, other.r) && this.c.equals(other.c);
  }
}
