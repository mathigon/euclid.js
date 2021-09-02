// =============================================================================
// Euclid.js | Intersection utilities
// (c) Mathigon
// =============================================================================


import {flatten} from '@mathigon/core';
import {isBetween, nearlyEquals, square, subsets} from '@mathigon/fermat';
import {Circle} from './circle';
import {Line, Ray, Segment} from './line';
import {Point} from './point';
import {isCircle, isLineLike, isPolygonLike} from './types';
import {GeoShape} from './utilities';


function liesOnSegment(s: Segment, p: Point) {
  if (nearlyEquals(s.p1.x, s.p2.x)) return isBetween(p.y, s.p1.y, s.p2.y);
  return isBetween(p.x, s.p1.x, s.p2.x);
}

function liesOnRay(r: Ray, p: Point) {
  if (nearlyEquals(r.p1.x, r.p2.x)) {
    return (p.y - r.p1.y) / (r.p2.y - r.p1.y) > 0;
  }
  return (p.x - r.p1.x) / (r.p2.x - r.p1.x) > 0;
}

function lineLineIntersection(l1: Line, l2: Line) {
  const d1x = l1.p1.x - l1.p2.x;
  const d1y = l1.p1.y - l1.p2.y;

  const d2x = l2.p1.x - l2.p2.x;
  const d2y = l2.p1.y - l2.p2.y;

  const d = d1x * d2y - d1y * d2x;
  if (nearlyEquals(d, 0)) return [];  // Colinear lines never intersect

  const q1 = l1.p1.x * l1.p2.y - l1.p1.y * l1.p2.x;
  const q2 = l2.p1.x * l2.p2.y - l2.p1.y * l2.p2.x;

  const x = q1 * d2x - d1x * q2;
  const y = q1 * d2y - d1y * q2;
  return [new Point(x / d, y / d)];
}

function circleCircleIntersection(c1: Circle, c2: Circle) {
  const d = Point.distance(c1.c, c2.c);

  // Circles are separate:
  if (d > c1.r + c2.r) return [];

  // One circles contains the other:
  if (d < Math.abs(c1.r - c2.r)) return [];

  // Circles are the same:
  if (nearlyEquals(d, 0) && nearlyEquals(c1.r, c2.r)) return [];

  // Circles touch:
  if (nearlyEquals(d, c1.r + c2.r)) return [new Line(c1.c, c2.c).midpoint];

  const a = (square(c1.r) - square(c2.r) + square(d)) / (2 * d);
  const b = Math.sqrt(square(c1.r) - square(a));

  const px = (c2.c.x - c1.c.x) * a / d + (c2.c.y - c1.c.y) * b / d + c1.c.x;
  const py = (c2.c.y - c1.c.y) * a / d - (c2.c.x - c1.c.x) * b / d + c1.c.y;
  const qx = (c2.c.x - c1.c.x) * a / d - (c2.c.y - c1.c.y) * b / d + c1.c.x;
  const qy = (c2.c.y - c1.c.y) * a / d + (c2.c.x - c1.c.x) * b / d + c1.c.y;

  return [new Point(px, py), new Point(qx, qy)];
}

// From http://mathworld.wolfram.com/Circle-LineIntersection.html
function lineCircleIntersection(l: Line, c: Circle) {
  const dx = l.p2.x - l.p1.x;
  const dy = l.p2.y - l.p1.y;
  const dr2 = square(dx) + square(dy);

  const cx = c.c.x;
  const cy = c.c.y;
  const D = (l.p1.x - cx) * (l.p2.y - cy) - (l.p2.x - cx) * (l.p1.y - cy);

  const disc = square(c.r) * dr2 - square(D);
  if (disc < 0) return [];  // No solution

  const xa = D * dy / dr2;
  const ya = -D * dx / dr2;
  if (nearlyEquals(disc, 0)) return [c.c.shift(xa, ya)];  // One solution

  const xb = dx * (dy < 0 ? -1 : 1) * Math.sqrt(disc) / dr2;
  const yb = Math.abs(dy) * Math.sqrt(disc) / dr2;
  return [c.c.shift(xa + xb, ya + yb), c.c.shift(xa - xb, ya - yb)];
}

/** Finds the intersection of two lines or circles. */
function simpleIntersection(a: Line|Circle, b: Line|Circle): Point[] {
  let results: Point[] = [];

  // TODO Handle Arcs and Rays
  if (isLineLike(a) && isLineLike(b)) {
    results = lineLineIntersection(a, b);
  } else if (isLineLike(a) && isCircle(b)) {
    results = lineCircleIntersection(a, b);
  } else if (isCircle(a) && isLineLike(b)) {
    results = lineCircleIntersection(b, a);
  } else if (isCircle(a) && isCircle(b)) {
    results = circleCircleIntersection(a, b);
  }

  for (const x of [a, b]) {
    if (x.type === 'segment') {
      results = results.filter(i => liesOnSegment(x as Segment, i));
    }
    if (x.type === 'ray') results = results.filter(i => liesOnRay(x as Ray, i));
  }

  return results;
}

/** Returns the intersection of two or more geometry objects. */
export function intersections(...elements: GeoShape[]): Point[] {
  if (elements.length < 2) return [];
  if (elements.length > 2) {
    return flatten(subsets(elements, 2).map(e => intersections(...e)));
  }

  let [a, b] = elements;

  if (isPolygonLike(b)) [a, b] = [b, a];

  if (isPolygonLike(a)) {
    // This hack is necessary to capture intersections between a line and a
    // vertex of a polygon. There are more edge cases to consider!
    const results = isLineLike(b) ? a.points.filter(p => (b as Line).contains(p)) : [];

    for (const e of a.edges) results.push(...intersections(e, b));
    return results;
  }

  // TODO Handle arcs, sectors and angles!
  return simpleIntersection(a as (Line|Circle), b as (Line|Circle));
}
