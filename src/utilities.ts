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
  rotateRad(angle: number, center?: SimplePoint): GeoElement;
  rotateDeg(angle: number, center?: SimplePoint): GeoElement;
  reflect(l: Line): GeoElement;
  scale(sx: number, sy?: number): GeoElement;
  shift(x: number, y?: number): GeoElement;
  translate(p: Point): GeoElement;
  equals(other: GeoElement, tolerance?: number, oriented?: boolean): boolean;
}

export interface GeoShape extends GeoElement {
  project(p: Point): Point;
  contains(p: Point, tolerance?: number): boolean;
  at(t: number): Point;

  rotate(angle: number, center?: SimplePoint): GeoShape;
  rotateRad(angle: number, center?: SimplePoint): GeoShape;
  rotateDeg(angle: number, center?: SimplePoint): GeoShape;
  reflect(l: Line): GeoShape;
  scale(sx: number, sy?: number): GeoShape;
  shift(x: number, y?: number): GeoShape;
  translate(p: Point): GeoShape;
}

export const TWO_PI = 2 * Math.PI;

export function rad(p: SimplePoint, c?: SimplePoint) {
  const a = Math.atan2(p.y - (c ? c.y : 0), p.x - (c ? c.x : 0));
  return mod(a, TWO_PI);
}
