// =============================================================================
// Euclid.js | Line, Ray and Segment Classes
// (c) Mathigon
// =============================================================================


import {clamp, isBetween, nearlyEquals} from '@mathigon/fermat';
import {ORIGIN, Point} from './point';
import {GeoShape, rad, SimplePoint, TransformMatrix} from './utilities';


/** An infinite straight line that goes through two points. */
export class Line implements GeoShape {
  readonly type: string = 'line';
  flag?: number;

  constructor(readonly p1: Point, readonly p2: Point) {}

  protected make(p1: Point, p2: Point) {
    return new Line(p1, p2);
  }

  /* The distance between the two points defining this line. */
  get length() {
    return Point.distance(this.p1, this.p2);
  }

  /* The squared distance between the two points defining this line. */
  get lengthSquared() {
    return (this.p1.x - this.p2.x) ** 2 + (this.p1.y - this.p2.y) ** 2;
  }

  /** The midpoint of this line. */
  get midpoint() {
    return Point.average(this.p1, this.p2);
  }

  /** The slope of this line. */
  get slope() {
    return (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x);
  }

  /** The y-axis intercept of this line. */
  get intercept() {
    return this.p1.y + this.slope * this.p1.x;
  }

  /** The angle formed between this line and the x-axis. */
  get angle() {
    return rad(this.p2, this.p1);
  }

  /** The point representing a unit vector along this line. */
  get unitVector() {
    return this.p2.subtract(this.p1).unitVector;
  }

  /** The point representing the perpendicular vector of this line. */
  get perpendicularVector() {
    return new Point(this.p2.y - this.p1.y,
      this.p1.x - this.p2.x).unitVector;
  }

  /** Finds the line parallel to this one, going though point p. */
  parallel(p: Point) {
    const q = Point.sum(p, Point.difference(this.p2, this.p1));
    return new Line(p, q);
  }

  /** Finds the line perpendicular to this one, going though point p. */
  perpendicular(p: Point) {
    return new Line(p, Point.sum(p, this.perpendicularVector));
  }

  /** The perpendicular bisector of this line. */
  get perpendicularBisector() {
    return this.perpendicular(this.midpoint);
  }

  /** Squared distance between a point and a line. */
  distanceSquared(p: Point) {
    const proj = this.project(p);
    return (p.x - proj.x) ** 2 + (p.y - proj.y) ** 2;
  }

  // ---------------------------------------------------------------------------

  /** Signed distance along the line (opposite of .at()). */
  offset(p: SimplePoint) {
    const a = Point.difference(this.p2, this.p1);
    const b = Point.difference(p, this.p1);
    return Point.dot(a, b) / this.lengthSquared;
  }

  /** Projects a point `p` onto this line. */
  project(p: SimplePoint) {
    return this.at(this.offset(p));
  }

  /** Returns which side of this line a point p is on (or 0 on the line). */
  side(p: SimplePoint, tolerance?: number) {
    const a = Point.difference(this.p2, this.p1);
    const b = Point.difference(p, this.p1);
    const d = b.x * a.y - b.y * a.x;
    return nearlyEquals(d, 0, tolerance) ? 0 : Math.sign(d);
  }

  /** Checks if a point p lies on this line. */
  contains(p: SimplePoint, tolerance?: number) {
    return this.side(p, tolerance) === 0;
  }

  /** Gets the point at a specific offset along the line (opposite of .offset()). */
  at(t: number) {
    return Point.interpolate(this.p1, this.p2, t);
  }

  // ---------------------------------------------------------------------------

  transform(m: TransformMatrix): this {
    return new (<any> this.constructor)(this.p1.transform(m),
      this.p2.transform(m));
  }

  /** Rotates this line by a given angle (in radians), optionally around point `c`. */
  rotate(a: number, c = ORIGIN): this {
    if (nearlyEquals(a, 0)) return this;
    return new (<any> this.constructor)(this.p1.rotate(a, c), this.p2.rotate(a, c));
  }

  reflect(l: Line): this {
    return new (<any> this.constructor)(this.p1.reflect(l), this.p2.reflect(l));
  }

  scale(sx: number, sy = sx) {
    return this.make(this.p1.scale(sx, sy), this.p2.scale(sx, sy));
  }

  shift(x: number, y = x) {
    return this.make(this.p1.shift(x, y), this.p2.shift(x, y));
  }

  translate(p: Point) {
    return this.shift(p.x, p.y);
  }

  equals(other: Line, tolerance?: number) {
    // Note: Checking line types breaks some applications in Mathigon textbooks.
    // if (other.type !== 'line') return false;
    return this.contains(other.p1, tolerance) && this.contains(other.p2, tolerance);
  }

  toString() {
    return `Line(p1: ${this.p1}, p2: ${this.p2})`;
  }
}


/** An infinite ray defined by an endpoint and another point on the ray. */
export class Ray extends Line {
  readonly type = 'ray';

  protected make(p1: Point, p2: Point) {
    return new Ray(p1, p2);
  }

  equals(other: Ray, tolerance?: number) {
    if (other.type !== 'ray') return false;
    return this.p1.equals(other.p1, tolerance) && this.contains(other.p2, tolerance);
  }

  toString() {
    return `Ray(p1: ${this.p1}, p2: ${this.p2})`;
  }
}


/** A finite line segment defined by its two endpoints. */
export class Segment extends Line {
  readonly type = 'segment';

  contains(p: Point, tolerance?: number) {
    if (!Line.prototype.contains.call(this, p, tolerance)) return false;
    if (this.p1.equals(p, tolerance) || this.p2.equals(p, tolerance)) return true;
    if (nearlyEquals(this.p1.x, this.p2.x, tolerance)) {
      return isBetween(p.y, this.p1.y, this.p2.y);
    } else {
      return isBetween(p.x, this.p1.x, this.p2.x);
    }
  }

  protected make(p1: Point, p2: Point) {
    return new Segment(p1, p2);
  }

  project(p: SimplePoint) {
    const a = Point.difference(this.p2, this.p1);
    const b = Point.difference(p, this.p1);

    const q = clamp(Point.dot(a, b) / this.lengthSquared, 0, 1);
    return Point.sum(this.p1, a.scale(q));
  }

  /** Contracts (or expands) a line by a specific ratio. */
  contract(x: number) {
    return new Segment(this.at(x), this.at(1 - x));
  }

  equals(other: Segment, tolerance?: number, oriented = false) {
    if (other.type !== 'segment') return false;

    return (this.p1.equals(other.p1, tolerance) && this.p2.equals(other.p2, tolerance)) ||
           (!oriented && this.p1.equals(other.p2, tolerance) && this.p2.equals(other.p1, tolerance));
  }

  toString() {
    return `Segment(p1: ${this.p1}, p2: ${this.p2})`;
  }
}
