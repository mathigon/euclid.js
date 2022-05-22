// =============================================================================
// Euclid.js | Angle Class
// (c) Mathigon
// =============================================================================


import {clamp, nearlyEquals} from '@mathigon/fermat';
import {Arc, Sector} from './arc';
import {Line, Segment} from './line';
import {ORIGIN, Point} from './point';
import {Polygon, Polyline} from './polygon';
import {GeoShape, SimplePoint, TransformMatrix, TWO_PI} from './utilities';


const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

/** Convert angles in radians to degrees. */
export function toDeg(n: number) {
  return n * RAD_TO_DEG;
}

/** Convert angles in degrees to radians. */
export function toRad(n: number) {
  return n * DEG_TO_RAD;
}


/** A 2-dimensional angle class, defined by three points. */
export class Angle implements GeoShape {
  readonly type = 'angle';

  constructor(readonly a: Point, readonly b: Point, readonly c: Point) {}

  static fromDegrees(val: number) {
    return Angle.fromRadians(val * (Math.PI / 180));
  }

  static fromRadians(val: number): Angle {
    const p1 = new Point(1, 0);
    const p2 = p1.rotate(val);
    return new Angle(p1, ORIGIN, p2);
  }

  /** Checks if `a` and `b` are roughly equivalent (by default, within one degree of eachother) */
  static equals(a: Angle, b: Angle, precision = Math.PI / 360) {
    return nearlyEquals(a.rad, b.rad, precision);
  }

  /** The size, in radians, of this angle. */
  get rad() {
    const phiA = Math.atan2(this.a.y - this.b.y, this.a.x - this.b.x);
    const phiC = Math.atan2(this.c.y - this.b.y, this.c.x - this.b.x);
    let phi = phiC - phiA;

    if (phi < 0) phi += TWO_PI;
    return phi;
  }

  /** The size, in degrees, of this angle. */
  get deg() {
    return this.rad * 180 / Math.PI;
  }

  /** Checks if this angle is right-angled. */
  get isRight() {
    // Within 1 deg of 90 deg.
    return nearlyEquals(this.rad, Math.PI / 2, Math.PI / 360);
  }

  /** The bisector of this angle. */
  get bisector() {
    if (this.b.equals(this.a)) return undefined;
    if (this.b.equals(this.c)) return undefined;

    const phiA = Math.atan2(this.a.y - this.b.y, this.a.x - this.b.x);
    const phiC = Math.atan2(this.c.y - this.b.y, this.c.x - this.b.x);
    let phi = (phiA + phiC) / 2;

    if (phiA > phiC) phi += Math.PI;

    const x = Math.cos(phi) + this.b.x;
    const y = Math.sin(phi) + this.b.y;

    return new Line(this.b, new Point(x, y));
  }

  /** Returns the smaller one of this and its supplementary angle. */
  get sup() {
    return (this.rad < Math.PI) ? this : new Angle(this.c, this.b, this.a);
  }

  /** Returns the Arc element corresponding to this angle. */
  get arc() {
    return new Arc(this.b, this.a, this.rad);
  }

  // ---------------------------------------------------------------------------

  /** Radius of the arc or sector representing this angle. */
  get radius() {
    return 24 + 20 * (1 - clamp(this.rad, 0, Math.PI) / Math.PI);
  }

  /** Shape object that can be used to draw this angle. */
  shape(filled = true, radius?: number, round?: boolean) {
    if (this.a.equals(this.b) || this.c.equals(this.b)) return new Polygon(ORIGIN);

    const angled = this.isRight && !round;
    if (!radius) radius = angled ? 20 : this.radius;

    const ba = new Segment(this.b, this.a);
    const a = ba.at(radius / ba.length);

    if (angled) {
      const bc = Point.difference(this.c, this.b).unitVector.scale(radius);
      if (filled) return new Polygon(this.b, a, a.add(bc), this.b.add(bc));
      return new Polyline(a, a.add(bc), this.b.add(bc));
    }

    if (filled) return new Sector(this.b, a, this.rad);
    return new Arc(this.b, a, this.rad);
  }


  // ---------------------------------------------------------------------------
  // These functions are just included for compatibility with GeoPath

  project(p: Point) {
    return this.contains(p) ? p : this.shape(true).project(p);
  }

  at() {
    return this.c;
  }

  offset() {
    return 0;
  }

  contains(p: Point) {
    return this.shape(true).contains(p);
  }

  // ---------------------------------------------------------------------------

  transform(m: TransformMatrix) {
    return new Angle(this.a.transform(m), this.b.transform(m), this.c.transform(m));
  }

  rotate(a: number, c?: SimplePoint) {
    if (nearlyEquals(a, 0)) return this;
    return new Angle(this.a.rotate(a, c), this.b.rotate(a, c), this.c.rotate(a, c));
  }

  reflect(l: Line) {
    return new Angle(this.a.reflect(l), this.b.reflect(l), this.c.reflect(l));
  }

  scale(sx: number, sy = sx) {
    return new Angle(this.a.scale(sx, sy), this.b.scale(sx, sy), this.c.scale(sx, sy));
  }

  shift(x: number, y = x) {
    return new Angle(this.a.shift(x, y), this.b.shift(x, y), this.c.shift(x, y));
  }

  translate(p: SimplePoint) {
    return new Angle(this.a.translate(p), this.b.translate(p), this.c.translate(p));
  }

  equals(a: Angle, precision?: number) {
    return Angle.equals(a, this, precision);
  }

  toString() {
    return `angle(${this.a},${this.b},${this.c})`;
  }
}
