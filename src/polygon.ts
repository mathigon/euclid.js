// =============================================================================
// Euclid.js | Polygon and Polyline Classes
// (c) Mathigon
// =============================================================================

import {last, tabulate} from '@mathigon/core';
import {nearlyEquals} from '@mathigon/fermat';
import {Circle} from './circle';
import {intersections} from './intersection';
import {Line, Segment} from './line';
import {ORIGIN, Point} from './point';
import {findClosest, GeoShape, SimplePoint, TransformMatrix, TWO_PI} from './utilities';

/** A polygon defined by its vertex points. */
export class Polygon implements GeoShape {
  readonly type: string = 'polygon';
  readonly points: Point[];
  readonly ['constructor']!: new (...points: Point[]) => this;

  constructor(...points: Point[]) {
    this.points = points;
  }

  get circumference() {
    if (this.points.length <= 1) return 0;
    let length = Point.distance(this.points[0], last(this.points));
    for (let i = 1; i < this.points.length; ++i) {
      length += Point.distance(this.points[i - 1], this.points[i]);
    }
    return length;
  }

  /**
   * The (signed) area of this polygon. The result is positive if the vertices
   * are ordered clockwise, and negative otherwise.
   */
  get signedArea() {
    const p = this.points;
    const n = p.length;
    let A = p[n - 1].x * p[0].y - p[0].x * p[n - 1].y;

    for (let i = 1; i < n; ++i) {
      A += p[i - 1].x * p[i].y - p[i].x * p[i - 1].y;
    }

    return A / 2;
  }

  get area() {
    return Math.abs(this.signedArea);
  }

  get centroid() {
    const p = this.points;
    const n = p.length;

    let Cx = 0;
    for (let i = 0; i < n; ++i) Cx += p[i].x;

    let Cy = 0;
    for (let i = 0; i < n; ++i) Cy += p[i].y;

    return new Point(Cx / n, Cy / n);
  }

  get edges() {
    const n = this.points.length;
    const edges = [];
    for (let i = 0; i < n; ++i) {
      edges.push(new Segment(this.points[i], this.points[(i + 1) % n]));
    }
    return edges;
  }

  get radius() {
    const c = this.centroid;
    const radii = this.points.map(p => Point.distance(p, c));
    return Math.max(...radii);
  }

  /** The oriented version of this polygon (vertices in clockwise order). */
  get oriented(): this {
    if (this.signedArea >= 0) return this;
    const points = [...this.points].reverse();
    return new this.constructor(...points);
  }

  /** Checks if two polygons p1 and p2 collide. */
  static collision(p1: Polygon, p2: Polygon, tolerance?: number) {
    // Check if one of the vertices is in one of the polygons.
    if (p1.points.some(q => p2.contains(q))) return true;
    if (p2.points.some(q => p1.contains(q))) return true;

    // Check if any of the edges overlap.
    for (const e1 of p1.edges) {
      for (const e2 of p2.edges) {
        if (intersections(e1, e2)[0]) return true;
      }
    }

    return p1.equals(p2, tolerance);
  }

  /** Creates a regular polygon. */
  static regular(n: number, radius = 1) {
    const da = TWO_PI / n;
    const a0 = Math.PI / 2 - da / 2;

    const points = tabulate((i) => Point.fromPolar(a0 + da * i, radius), n);
    return new Polygon(...points);
  }

  /** Interpolates the points of two polygons */
  static interpolate(p1: Polygon, p2: Polygon, t = 0.5) {
    // TODO support interpolating polygons with different numbers of points
    const points = p1.points.map(
      (p, i) => Point.interpolate(p, p2.points[i], t));
    return new Polygon(...points);
  }

  static convexHull(...points: Point[]) {
    // https://algorithmist.com/wiki/Monotone_chain_convex_hull
    if (points.length <= 3) return new Polygon(...points);

    const sorted = points.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
    const sortedReverse = sorted.slice(0).reverse();

    const upper: Point[] = [];
    const lower: Point[] = [];

    for (const [source, target] of [[sorted, upper], [sortedReverse, lower]]) {
      for (const p of source) {
        while (target.length >= 2) {
          const p1 = target[target.length - 1];
          const p2 = target[target.length - 2];
          if ((p1.x - p2.x) * (p.y - p2.y) >= (p.x - p2.x) * (p1.y - p2.y)) {
            target.pop();
          } else {
            break;
          }
        }
        target.push(p);
      }
      target.pop();
    }

    return new Polygon(...upper.concat(lower));
  }

  // ---------------------------------------------------------------------------

  /**
   * Checks if a point p lies inside this polygon, by using a ray-casting
   * algorithm and calculating the number of intersections.
   */
  contains(p: Point) {
    let inside = false;

    for (const e of this.edges) {
      // Exclude points lying *on* the edge.
      if (e.p1.equals(p) || e.contains(p)) return false;
      if ((e.p1.y > p.y) === (e.p2.y > p.y)) continue;

      const det = (e.p2.x - e.p1.x) / (e.p2.y - e.p1.y);
      if (p.x < det * (p.y - e.p1.y) + e.p1.x) inside = !inside;
    }

    return inside;
  }

  at(t: number) {
    if (t < 0) t += Math.floor(t);
    const offset = t * this.circumference;
    let cum = 0;
    for (const e of this.edges) {
      const l = e.length;
      if (cum + l > offset) return e.at((offset - cum) / l);
      cum += l;
    }
    return this.points[0];
  }

  offset(p: Point) {
    const edges = this.edges;
    const proj = findClosest(p, this.edges) || [this.points[0], 0] as const;

    let offset = 0;
    for (let i = 0; i < proj[1]; ++i) offset += edges[i].length;
    offset += edges[proj[1]].offset(p) * edges[proj[1]].length;

    return offset / this.circumference;
  }

  project(p: Point) {
    const proj = findClosest(p, this.edges);
    return proj ? proj[0] : this.points[0];
  }

  /** Center this polygon on a given point or the origin */
  centerAt(on = ORIGIN) {
    return this.translate(on.subtract(this.centroid));
  }

  // ---------------------------------------------------------------------------

  transform(m: TransformMatrix): this {
    return new this.constructor(...this.points.map(p => p.transform(m)));
  }

  /** Rotates this polygon by a given angle (in radians), optionally around point `center`. */
  rotate(a: number, center = ORIGIN): this {
    if (nearlyEquals(a, 0)) return this;
    const points = this.points.map(p => p.rotate(a, center));
    return new this.constructor(...points);
  }

  reflect(line: Line): this {
    const points = this.points.map(p => p.reflect(line));
    return new this.constructor(...points);
  }

  scale(sx: number, sy = sx): this {
    const points = this.points.map(p => p.scale(sx, sy));
    return new this.constructor(...points);
  }

  shift(x: number, y = x): this {
    const points = this.points.map(p => p.shift(x, y));
    return new this.constructor(...points);
  }

  translate(p: SimplePoint) {
    return this.shift(p.x, p.y);
  }

  equals(other: Polygon, tolerance?: number, oriented?: boolean) {
    const n = this.points.length;
    if (n !== other.points.length) return false;
    const p1 = oriented ? this : this.oriented;
    const p2 = oriented ? other : other.oriented;

    // Check if all the points, match, but allow different offsets
    for (let offset = 0; offset < n; ++offset) {
      if (p1.points.every((p, i) => p.equals(p2.points[(i + offset) % n], tolerance))) {
        return true;
      }
    }

    return false;
  }

  toString() {
    return `polygon(${this.points.join(',')})`;
  }
}


/** A polyline defined by its vertex points. */
export class Polyline extends Polygon {
  readonly type = 'polyline';

  get circumference() {
    return this.length;
  }

  get length() {
    let length = 0;
    for (let i = 1; i < this.points.length; ++i) {
      length += Point.distance(this.points[i - 1], this.points[i]);
    }
    return length;
  }

  /** @returns {Segment[]} */
  get edges() {
    const edges = [];
    for (let i = 0; i < this.points.length - 1; ++i) {
      edges.push(new Segment(this.points[i], this.points[i + 1]));
    }
    return edges;
  }

  toString() {
    return `polyline(${this.points.join(',')})`;
  }
}


/** A triangle defined by its three vertices. */
export class Triangle extends Polygon {
  readonly type = 'triangle';

  get circumcircle() {
    const [a, b, c] = this.points;

    const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));

    const ux = (a.x ** 2 + a.y ** 2) * (b.y - c.y) +
               (b.x ** 2 + b.y ** 2) * (c.y - a.y) +
               (c.x ** 2 + c.y ** 2) * (a.y - b.y);

    const uy = (a.x ** 2 + a.y ** 2) * (c.x - b.x) +
               (b.x ** 2 + b.y ** 2) * (a.x - c.x) +
               (c.x ** 2 + c.y ** 2) * (b.x - a.x);

    const center = new Point(ux / d, uy / d);
    const radius = Point.distance(center, this.points[0]);

    if (isNaN(radius) || radius > Number.MAX_SAFE_INTEGER) return;
    return new Circle(center, radius);
  }

  get incircle() {
    const edges = this.edges;
    const sides = edges.map(e => e.length);
    const total = sides[0] + sides[1] + sides[2];
    const [a, b, c] = this.points;

    const ux = sides[1] * a.x + sides[2] * b.x + sides[0] * c.x;
    const uy = sides[1] * a.y + sides[2] * b.y + sides[0] * c.y;

    const center = new Point(ux / total, uy / total);
    const radius = center.distanceFromLine(edges[0]);

    return isNaN(radius) ? undefined : new Circle(center, radius);
  }

  get orthocenter() {
    const [a, b, c] = this.points;
    const h1 = new Line(a, b).perpendicular(c);
    const h2 = new Line(a, c).perpendicular(b);
    return intersections(h1, h2)[0];
  }
}
