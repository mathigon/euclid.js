// =============================================================================
// Euclid.js | Utilities
// (c) Mathigon
// =============================================================================


import {mod} from '@mathigon/fermat';
import {Line} from './line';
import {Point} from './point';


export type TransformMatrix = [[number, number, number], [number, number, number]];

export type SimplePoint = {x: number, y: number};

export interface GeoElement {
  type: string;
  transform(matrix: TransformMatrix): GeoElement;
  rotate(angle: number, center?: SimplePoint): GeoElement;
  reflect(l: Line): GeoElement;
  scale(sx: number, sy?: number): GeoElement;
  shift(x: number, y?: number): GeoElement;
  translate(p: Point): GeoElement;
  equals(other: GeoElement, tolerance?: number, oriented?: boolean): boolean;
  toString(): string;
}

export interface GeoShape extends GeoElement {
  project(p: Point): Point;
  contains(p: Point, tolerance?: number): boolean;
  at(t: number): Point;
  offset(p: Point): number;

  rotate(angle: number, center?: SimplePoint): GeoShape;
  reflect(l: Line): GeoShape;
  scale(sx: number, sy?: number): GeoShape;
  shift(x: number, y?: number): GeoShape;
  translate(p: SimplePoint): GeoShape;
}

export const TWO_PI = 2 * Math.PI;

export function rad(p: SimplePoint, c?: SimplePoint) {
  const a = Math.atan2(p.y - (c ? c.y : 0), p.x - (c ? c.x : 0));
  return mod(a, TWO_PI);
}

// TODO Merge this with findMin() in @mathigon/core
export function findClosest(p: Point, items: GeoShape[]): [Point, number]|undefined {
  let q: Point|undefined = undefined;
  let d = Infinity;
  let index = -1;

  for (const [i, e] of items.entries()) {
    const q1 = e.project(p);
    const d1 = Point.distance(p, q1);
    if (d1 < d) {
      q = q1;
      d = d1;
      index = i;
    }
  }

  return q ? [q, index] : undefined;
}
