// =============================================================================
// Euclid.js | Point Class
// (c) Mathigon
// =============================================================================


import {total} from '@mathigon/core';
import {clamp, lerp, nearlyEquals, Random, roundTo, square} from '@mathigon/fermat';
import {Bounds} from './bounds';
import {Line} from './line';
import {GeoElement, rad, SimplePoint, TransformMatrix} from './utilities';


/** A single point class defined by two coordinates x and y. */
export class Point implements GeoElement, SimplePoint {
  readonly type = 'point';

  constructor(readonly x = 0, readonly y = 0) {}

  get unitVector() {
    if (nearlyEquals(this.length, 0)) return new Point(1, 0);
    return this.scale(1 / this.length);
  }

  get length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  get inverse() {
    return new Point(-this.x, -this.y);
  }

  get flip() {
    return new Point(this.y, this.x);
  }

  get perpendicular() {
    return new Point(-this.y, this.x);
  }

  get array() {
    return [this.x, this.y];
  }

  /** Finds the perpendicular distance between this point and a line. */
  distanceFromLine(l: Line) {
    return Point.distance(this, l.project(this));
  }

  /** Clamps this point to specific bounds. */
  clamp(bounds: Bounds, padding = 0) {
    const x = clamp(this.x, bounds.xMin + padding, bounds.xMax - padding);
    const y = clamp(this.y, bounds.yMin + padding, bounds.yMax - padding);
    return new Point(x, y);
  }

  changeCoordinates(originCoords: Bounds, targetCoords: Bounds) {
    const x = targetCoords.xMin + (this.x - originCoords.xMin) /
              (originCoords.dx) * (targetCoords.dx);
    const y = targetCoords.yMin + (this.y - originCoords.yMin) /
              (originCoords.dy) * (targetCoords.dy);
    return new Point(x, y);
  }

  add(p: SimplePoint) {
    return Point.sum(this, p);
  }

  subtract(p: SimplePoint) {
    return Point.difference(this, p);
  }

  round(inc = 1) {
    return new Point(roundTo(this.x, inc), roundTo(this.y, inc));
  }

  floor() {
    return new Point(Math.floor(this.x), Math.floor(this.y));
  }

  mod(x: number, y = x) {
    return new Point(this.x % x, this.y % y);
  }

  angle(c = ORIGIN) {
    return rad(this, c);
  }

  // Snap to the x or y values of another point
  snap(p: Point, tolerance = 5) {
    if (nearlyEquals(this.x, p.x, tolerance)) return new Point(p.x, this.y);
    if (nearlyEquals(this.y, p.y, tolerance)) return new Point(this.x, p.y);
    return this;
  }

  /** Calculates the average of multiple points. */
  static average(...points: SimplePoint[]) {
    const x = total(points.map(p => p.x)) / points.length;
    const y = total(points.map(p => p.y)) / points.length;
    return new Point(x, y);
  }

  /** Calculates the dot product of two points p1 and p2. */
  static dot(p1: SimplePoint, p2: SimplePoint) {
    return p1.x * p2.x + p1.y * p2.y;
  }

  static sum(p1: SimplePoint, p2: SimplePoint) {
    return new Point(p1.x + p2.x, p1.y + p2.y);
  }

  static difference(p1: SimplePoint, p2: SimplePoint) {
    return new Point(p1.x - p2.x, p1.y - p2.y);
  }

  /** Returns the Euclidean distance between two points p1 and p2. */
  static distance(p1: SimplePoint, p2: SimplePoint) {
    return Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y));
  }

  /** Returns the Manhattan distance between two points p1 and p2. */
  static manhattan(p1: SimplePoint, p2: SimplePoint) {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
  }

  /** Interpolates two points p1 and p2 by a factor of t. */
  static interpolate(p1: SimplePoint, p2: SimplePoint, t = 0.5) {
    return new Point(lerp(p1.x, p2.x, t), lerp(p1.y, p2.y, t));
  }

  /** Interpolates a list of multiple points. */
  static interpolateList(points: SimplePoint[], t = 0.5) {
    const n = points.length - 1;
    const a = Math.floor(clamp(t, 0, 1) * n);
    return Point.interpolate(points[a], points[a + 1], n * t - a);
  }

  /** Creates a point from polar coordinates. */
  static fromPolar(angle: number, r = 1) {
    return new Point(r * Math.cos(angle), r * Math.sin(angle));
  }

  static random(b: Bounds) {
    const x = Random.uniform(b.xMin, b.xMax);
    const y = Random.uniform(b.yMin, b.yMax);
    return new Point(x, y);
  }

  static equals(p1: SimplePoint, p2: SimplePoint, precision?: number) {
    return nearlyEquals(p1.x, p2.x, precision) && nearlyEquals(p1.y, p2.y, precision);
  }

  /** Check if p1, p2 and p3 lie on a straight line. */
  static colinear(p1: SimplePoint, p2: SimplePoint, p3: SimplePoint, tolerance?: number) {
    const dx1 = p1.x - p2.x;
    const dy1 = p1.y - p2.y;
    const dx2 = p2.x - p3.x;
    const dy2 = p2.y - p3.y;
    return nearlyEquals(dx1 * dy2, dx2 * dy1, tolerance);
  }

  // ---------------------------------------------------------------------------

  /** Transforms this point using a 2x3 matrix m. */
  transform(m: TransformMatrix) {
    const x = m[0][0] * this.x + m[0][1] * this.y + m[0][2];
    const y = m[1][0] * this.x + m[1][1] * this.y + m[1][2];
    return new Point(x, y);
  }

  /** Rotates this point by a given angle (in radians) around point `c`. */
  rotate(angle: number, c: SimplePoint = ORIGIN) {
    if (nearlyEquals(angle, 0)) return this;

    const x0 = this.x - c.x;
    const y0 = this.y - c.y;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const x = x0 * cos - y0 * sin + c.x;
    const y = x0 * sin + y0 * cos + c.y;
    return new Point(x, y);
  }

  /** Reflects this point across a line l. */
  reflect(l: Line) {
    const v = l.p2.x - l.p1.x;
    const w = l.p2.y - l.p1.y;

    const x0 = this.x - l.p1.x;
    const y0 = this.y - l.p1.y;

    const mu = (v * y0 - w * x0) / (v * v + w * w);

    const x = this.x + 2 * mu * w;
    const y = this.y - 2 * mu * v;
    return new Point(x, y);
  }

  scale(sx: number, sy = sx) {
    return new Point(this.x * sx, this.y * sy);
  }

  shift(x: number, y = x) {
    return new Point(this.x + x, this.y + y);
  }

  translate(p: SimplePoint) {
    return this.shift(p.x, p.y);  // Alias for .add()
  }

  equals(other: GeoElement|SimplePoint, precision?: number) {
    return Point.equals(this, other as SimplePoint, precision);
  }

  toString() {
    return `point(${this.x},${this.y})`;
  }
}

export const ORIGIN = new Point(0, 0);
