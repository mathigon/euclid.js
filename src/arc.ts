// =============================================================================
// Euclid.js | Arc and Sector Classes
// (c) Mathigon
// =============================================================================


import {clamp} from '@mathigon/fermat';
import {Line} from './line';
import {Point, ORIGIN} from './point';
import {GeoShape, rad, TransformMatrix, TWO_PI} from './utilities';


/** An arc segment of a circle, with given center, start point and angle. */
export class Arc implements GeoShape {
  readonly type: string = 'arc';

  constructor(readonly c: Point, readonly start: Point,
    readonly angle: number) {
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
    return new (<any> this.constructor)(this.c, this.at(p / 2),
        this.angle * (1 - p));
  }

  get minor(): this {
    if (this.angle <= Math.PI) return this;
    return new (<any> this.constructor)(this.c, this.end, TWO_PI - this.angle);
  }

  get major(): this {
    if (this.angle >= Math.PI) return this;
    return new (<any> this.constructor)(this.c, this.end, TWO_PI - this.angle);
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

  contains(p: Point) {
    // TODO Is there a better way to do this?
    return p.equals(this.project(p));
  }

  // ---------------------------------------------------------------------------

  transform(m: TransformMatrix): this {
    return new (<any> this.constructor)(this.c.transform(m),
        this.start.transform(m), this.angle);
  }

  rotate(a: number, c = ORIGIN): this {
    return new (<any> this.constructor)(this.c.rotate(a, c),
        this.start.rotate(a, c), this.angle);
  }

  reflect(l: Line): this {
    return new (<any> this.constructor)(this.c.reflect(l),
        this.start.reflect(l), this.angle);
  }

  scale(sx: number, sy = sx): this {
    return new (<any> this.constructor)(this.c.scale(sx, sy),
        this.start.scale(sx, sy), this.angle);
  }

  shift(x: number, y = x): this {
    return new (<any> this.constructor)(this.c.shift(x, y),
        this.start.shift(x, y), this.angle);
  }

  translate(p: Point) {
    return this.shift(p.x, p.y);
  }

  equals() {
    // TODO Implement
    return false;
  }
}

export class Sector extends Arc {
  readonly type = 'sector';
}
