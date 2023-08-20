// =============================================================================
// Euclid.js | Ellipse Class
// (c) Mathigon
// =============================================================================


import {nearlyEquals, quadratic} from '@mathigon/fermat';
import {Angle} from './angle';
import {Line} from './line';
import {ORIGIN, Point} from './point';
import {GeoShape, SimplePoint, TransformMatrix, TWO_PI} from './utilities';


export class Ellipse implements GeoShape {
  readonly type = 'ellipse';
  readonly a: number;
  readonly b: number;
  readonly angle: number;
  readonly f1: Point;
  readonly f2: Point;

  /**
   * @param c Center of the ellipse
   * @param a Major axis
   * @param b Minor axis
   * @param angle The rotation of the major axis of the ellipse.
   */
  constructor(readonly c: Point, a: number, b: number, angle = 0) {
    if (a < b) {
      [a, b] = [b, a];
      angle += Math.PI / 2;
    }
    this.a = a;
    this.b = b;
    this.angle = angle;

    const f = Math.sqrt(a ** 2 - b ** 2);  // Distance from focus to the center.
    this.f1 = this.c.add(new Point(-f, 0).rotate(angle));
    this.f2 = this.c.add(new Point(f, 0).rotate(angle));
  }

  get rx() {
    return nearlyEquals(this.angle, 0) ? this.a : nearlyEquals(this.angle, Math.PI / 2) ? this.b : undefined;
  }

  get ry() {
    return nearlyEquals(this.angle, 0) ? this.b : nearlyEquals(this.angle, Math.PI / 2) ? this.a : undefined;
  }

  normalAt(p: Point) {
    return new Angle(this.f1, p, this.f2).bisector!;
  }

  /** Intersection between an ellipse and a line. */
  intersect(line: Line) {
    line = line.rotate(-this.angle, this.c);

    const dx = line.p1.x - line.p2.x;
    const dy = line.p1.y - line.p2.y;

    const px = this.c.x - line.p1.x;
    const py = this.c.y - line.p1.y;

    const A = (dx / this.a) ** 2 + (dy / this.b) ** 2;
    const B = (2 * px * dx) / this.a ** 2 + (2 * py * dy) / this.b ** 2;
    const C = (px / this.a) ** 2 + (py / this.b) ** 2 - 1;

    const points = quadratic(A, B, C);
    return points.map((t) => line.at(t).rotate(this.angle, this.c));
  }

  /**
   * Creates a new Ellipse. StringLength is the length of string from one foci
   * to a point on the circumference, to the other foci.
   */
  static fromFoci(f1: Point, f2: Point, stringLength: number) {
    const c = Point.distance(f1, f2) / 2;  // Half distance between foci.
    const a = stringLength / 2;
    const b = Math.sqrt(a ** 2 - c ** 2);
    const angle = new Line(f1, f2).angle;
    return new Ellipse(Point.interpolate(f1, f2), a, b, angle);
  }

  // ---------------------------------------------------------------------------

  get majorVertices() {
    return [this.c.add(new Point(-this.a, 0).rotate(this.angle)),
      this.c.add(new Point(this.a, 0).rotate(this.angle))];
  }

  get minorVertices() {
    return [this.c.add(new Point(0, -this.b).rotate(this.angle)),
      this.c.add(new Point(0, this.b).rotate(this.angle))];
  }

  get extremes(): Point[] {
    // See https://math.stackexchange.com/questions/4457548/find-extreme-values-of-ellipse
    const {a, b, angle} = this;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const sqSum = a**2 + b**2;
    const sqDiff = (a**2 - b**2) * Math.cos(2 * angle);

    const yMax = Math.sqrt((sqSum - sqDiff) / 2);
    const xAtYMax = yMax * sqSum * sin * cos / (a**2 * sin**2 + b**2 * cos**2);

    const xMax = Math.sqrt((sqSum + sqDiff) / 2);
    const yAtXMax = xMax * sqSum * sin * cos / (a**2 * cos**2 + b**2 * sin**2);

    return [new Point(xAtYMax, yMax).add(this.c),
      new Point(xAtYMax, yMax).inverse.add(this.c),
      new Point(xMax, yAtXMax).add(this.c),
      new Point(xMax, yAtXMax).inverse.add(this.c)];
  }

  project(p: Point) {
    p = p.rotate(-this.angle, this.c);
    const th = p.angle(this.c);
    return this.at(th / TWO_PI);
  }

  at(t: number) {
    const th = TWO_PI * t;
    return this.c
      .shift(this.a * Math.cos(th), this.b * Math.sin(th))
      .rotate(this.angle, this.c);
  }

  offset(_p: Point) {
    // TODO Implement
    return 0.5;
  }

  contains(p: Point) {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    const A = cos ** 2 / this.a ** 2 + sin ** 2 / this.b ** 2;
    const B = 2 * cos * sin * (1 / this.a ** 2 - 1 / this.b ** 2);
    const C = sin ** 2 / this.a ** 2 + cos ** 2 / this.b ** 2;
    return A * p.x ** 2 + B * p.x * p.y + C * p.y ** 2 <= 1;
  }

  // ---------------------------------------------------------------------------

  transform(_m: TransformMatrix): this {
    // TODO Implement
    return this;
  }

  rotate(a: number, c = ORIGIN) {
    const l = new Line(this.f1, this.f2).rotate(a, c);
    return Ellipse.fromFoci(l.p1, l.p2, this.a * 2);
  }

  reflect(l: Line) {
    const axis = new Line(this.f1, this.f2).reflect(l);
    return Ellipse.fromFoci(axis.p1, axis.p2, this.a * 2);
  }

  scale(sx: number, sy = sx) {
    return new Ellipse(this.c.scale(sx, sy), this.a * sx, this.b * sy, this.angle);
  }

  shift(x: number, y = x) {
    return new Ellipse(this.c.shift(x, y), this.a, this.b, this.angle);
  }

  translate(p: SimplePoint) {
    return new Ellipse(this.c.translate(p), this.a, this.b, this.angle);
  }

  equals(other: Ellipse, tolerance?: number) {
    return (
      nearlyEquals(this.a, other.a, tolerance) &&
      nearlyEquals(this.b, other.b, tolerance) &&
      nearlyEquals(this.angle, other.angle, tolerance) &&
      this.c.equals(other.c, tolerance)
    );
  }

  toString() {
    return `ellipse(${this.c},${this.a},${this.b},${this.angle})`;
  }
}
