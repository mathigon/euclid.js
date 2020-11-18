// =============================================================================
// Euclid.js | Type Checking
// (c) Mathigon
// =============================================================================


import {Angle} from './angle';
import {Arc, Sector} from './arc';
import {Circle} from './circle';
import {Ellipse} from './ellipse';
import {Line, Ray, Segment} from './line';
import {Point} from './point';
import {Polygon, Polyline} from './polygon';
import {Rectangle} from './rectangle';
import {GeoElement} from './utilities';


export function isPolygonLike(shape: GeoElement): shape is Polygon|Rectangle {
  return ['polygon', 'polyline', 'rectangle', 'triangle'].includes(shape.type);
}

export function isPolygon(shape: GeoElement): shape is Polygon {
  return ['polygon', 'triangle'].includes(shape.type);
}

export function isPolyline(shape: GeoElement): shape is Polyline {
  return shape.type === 'polyline';
}

export function isRectangle(shape: GeoElement): shape is Rectangle {
  return shape.type === 'rectangle';
}

export function isLineLike(shape: GeoElement): shape is Line|Ray|Segment {
  return ['line', 'ray', 'segment'].includes(shape.type);
}

export function isLine(shape: GeoElement): shape is Line {
  return shape.type === 'line';
}

export function isRay(shape: GeoElement): shape is Ray {
  return shape.type === 'ray';
}

export function isSegment(shape: GeoElement): shape is Segment {
  return shape.type === 'segment';
}

export function isCircle(shape: GeoElement): shape is Circle {
  return shape.type === 'circle';
}

export function isEllipse(shape: GeoElement): shape is Ellipse {
  return shape.type === 'ellipse';
}

export function isArc(shape: GeoElement): shape is Arc {
  return shape.type === 'arc';
}

export function isSector(shape: GeoElement): shape is Sector {
  return shape.type === 'sector';
}

export function isAngle(shape: GeoElement): shape is Angle {
  return shape.type === 'angle';
}

export function isPoint(shape: GeoElement): shape is Point {
  return shape.type === 'point';
}
