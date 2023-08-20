// =============================================================================
// Euclid.js | Arc and Sector Classes
// (c) Mathigon
// =============================================================================


import {clamp, nearlyEquals} from '@mathigon/fermat';
import {Angle} from './angle';
import {Circle} from './circle';
import {Line} from './line';
import {ORIGIN, Point} from './point';
import {GeoShape, rad, SimplePoint, TransformMatrix, TWO_PI} from './utilities';


/** An arc segment of a circle, with given center, start point and angle. */
export class Arc implements GeoShape {
  readonly type: string = 'arc';
  readonly ['constructor']!: new (c: Point, start: Point, angle: number) => this;

  constructor(readonly c: Point, readonly start: Point, readonly angle: number) {
  }

  get circle() {
    return new Circle(this.c, this.radius);
  }

  get radius() {
    return Point.distance(this.c, this.start);
  }

  get end() {
    return this.start.rotate(this.angle, this.c);
  }

  get startAngle() {
    return rad(this.start, this.c);
  }

  contract(p: number): this {
    return new this.constructor(this.c, this.at(p / 2), this.angle * (1 - p));
  }

  get minor(): this {
    if (this.angle <= Math.PI) return this;
    return new this.constructor(this.c, this.end, TWO_PI - this.angle);
  }

  get major(): this {
    if (this.angle >= Math.PI) return this;
    return new this.constructor(this.c, this.end, TWO_PI - this.angle);
  }

  get center() {
    return this.at(0.5);
  }

  // ---------------------------------------------------------------------------

  project(p: Point) {
    const start = this.startAngle;
    const end = start + this.angle;

    let angle = rad(p, this.c);
    if (end > TWO_PI && angle < end - TWO_PI) angle += TWO_PI;
    angle = clamp(angle, start, end);

    return this.c.shift(this.radius, 0).rotate(angle, this.c);
  }

  at(t: number) {
    return this.start.rotate(this.angle * t, this.c);
  }

  offset(p: Point) {
    return new Angle(this.start, this.c, p).rad / this.angle;
  }

  contains(p: Point) {
    // TODO Is there a better way to do this?
    return p.equals(this.project(p));
  }

  // ---------------------------------------------------------------------------

  transform(m: TransformMatrix): this {
    return new this.constructor(this.c.transform(m),
      this.start.transform(m), this.angle);
  }

  /** Rotates this arc by a given angle (in radians), optionally around point `c`. */
  rotate(a: number, c = ORIGIN): this {
    if (nearlyEquals(a, 0)) return this;
    return new this.constructor(this.c.rotate(a, c),
      this.start.rotate(a, c), this.angle);
  }

  reflect(l: Line): this {
    return new this.constructor(this.c.reflect(l),
      this.start.reflect(l), this.angle);
  }

  scale(sx: number, sy = sx): this {
    return new this.constructor(this.c.scale(sx, sy),
      this.start.scale(sx, sy), this.angle);
  }

  shift(x: number, y = x): this {
    return new this.constructor(this.c.shift(x, y),
      this.start.shift(x, y), this.angle);
  }

  translate(p: SimplePoint) {
    return this.shift(p.x, p.y);
  }

  equals() {
    // TODO Implement
    return false;
  }

  toString() {
    return `arc(${this.c},${this.start},${this.angle})`;
  }
}

export class Sector extends Arc {
  readonly type = 'sector';

  contains(p: Point) {
    return Point.distance(p, this.c) <= this.radius && new Angle(this.start, this.c, p).rad <= this.angle;
  }

  toString() {
    return `sector(${this.c},${this.start},${this.angle})`;
  }
}
