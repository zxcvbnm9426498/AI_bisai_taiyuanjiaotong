declare namespace BMapGL {
  class Map {
    constructor(container: string | HTMLElement, options?: MapOptions);
    centerAndZoom(center: Point | string, zoom: number): void;
    addControl(control: Control): void;
    setMapStyleV2(style: object): void;
    clearOverlays(): void;
    getZoom(): number;
    setZoom(zoom: number): void;
    getCenter(): Point;
    setCenter(center: Point | string): void;
    addOverlay(overlay: Overlay): void;
    enableScrollWheelZoom(enable?: boolean): void;
    removeOverlay(overlay: Overlay): void;
    openInfoWindow(infoWindow: InfoWindow, point: Point): void;
  }

  class Point {
    constructor(lng: number, lat: number);
    lng: number;
    lat: number;
  }

  class Size {
    constructor(width: number, height: number);
    width: number;
    height: number;
  }

  class Icon {
    constructor(url: string, size: Size, opts?: IconOptions);
    setImageSize(size: Size): void;
  }

  class Polyline {
    constructor(points: Point[], opts?: PolylineOptions);
    addEventListener(event: string, handler: Function): void;
  }

  class Marker {
    constructor(point: Point, opts?: MarkerOptions);
    addEventListener(event: string, handler: Function): void;
    setAnimation(animation: any): void;
  }

  class InfoWindow {
    constructor(content: string | HTMLElement, opts?: InfoWindowOptions);
    setContent(content: string | HTMLElement): void;
  }

  class Label {
    constructor(content: string, opts?: LabelOptions);
  }

  interface MapOptions {
    minZoom?: number;
    maxZoom?: number;
    enableMapClick?: boolean;
    enableDragging?: boolean;
    enableScrollWheelZoom?: boolean;
    enableDoubleClickZoom?: boolean;
  }

  interface PolylineOptions {
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    strokeStyle?: string;
  }

  interface MarkerOptions {
    icon?: Icon;
    enableDragging?: boolean;
    rotation?: number;
    title?: string;
    offset?: Size;
  }

  interface IconOptions {
    anchor?: Size;
    imageOffset?: Size;
    imageSize?: Size;
  }

  interface InfoWindowOptions {
    width?: number;
    height?: number;
    title?: string;
    maxWidth?: number;
    offset?: Size;
    enableCloseOnClick?: boolean;
    enableMessage?: boolean;
  }

  interface LabelOptions {
    position?: Point;
    offset?: Size;
    enableMassClear?: boolean;
    styles?: object;
  }

  class Control {
    constructor();
  }

  class ScaleControl extends Control {
    constructor(opts?: ScaleControlOptions);
  }

  class ZoomControl extends Control {
    constructor(opts?: ZoomControlOptions);
  }

  class NavigationControl extends Control {
    constructor(opts?: NavigationControlOptions);
  }

  class MapTypeControl extends Control {
    constructor(opts?: MapTypeControlOptions);
  }

  interface ControlOptions {
    anchor?: number;
    offset?: Size;
  }

  interface ScaleControlOptions extends ControlOptions {}
  interface ZoomControlOptions extends ControlOptions {}
  interface NavigationControlOptions extends ControlOptions {
    type?: number;
  }
  interface MapTypeControlOptions extends ControlOptions {}

  interface Overlay {}

  const BMAP_ANIMATION_DROP: any;
  const BMAP_ANCHOR_TOP_LEFT: number;
  const BMAP_ANCHOR_TOP_RIGHT: number;
  const BMAP_ANCHOR_BOTTOM_LEFT: number;
  const BMAP_ANCHOR_BOTTOM_RIGHT: number;
}

declare namespace BMap {
  class Map {
    constructor(container: string | HTMLElement, options?: MapOptions);
    centerAndZoom(center: Point | string, zoom: number): void;
    addControl(control: Control): void;
    setMapStyleV2(style: object): void;
    clearOverlays(): void;
    getZoom(): number;
    setZoom(zoom: number): void;
    getCenter(): Point;
    setCenter(center: Point | string): void;
    addOverlay(overlay: Overlay): void;
    enableScrollWheelZoom(enable?: boolean): void;
    removeOverlay(overlay: Overlay): void;
    openInfoWindow(infoWindow: InfoWindow, point: Point): void;
  }

  class Point {
    constructor(lng: number, lat: number);
    lng: number;
    lat: number;
  }

  class Size {
    constructor(width: number, height: number);
    width: number;
    height: number;
  }

  class Icon {
    constructor(url: string, size: Size, opts?: IconOptions);
    setImageSize(size: Size): void;
  }

  class Polyline {
    constructor(points: Point[], opts?: PolylineOptions);
    addEventListener(event: string, handler: Function): void;
  }

  class Marker {
    constructor(point: Point, opts?: MarkerOptions);
    addEventListener(event: string, handler: Function): void;
    setAnimation(animation: any): void;
  }

  class InfoWindow {
    constructor(content: string | HTMLElement, opts?: InfoWindowOptions);
    setContent(content: string | HTMLElement): void;
  }

  class Label {
    constructor(content: string, opts?: LabelOptions);
  }

  interface MapOptions {
    minZoom?: number;
    maxZoom?: number;
    enableMapClick?: boolean;
    enableDragging?: boolean;
    enableScrollWheelZoom?: boolean;
    enableDoubleClickZoom?: boolean;
  }

  interface PolylineOptions {
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    strokeStyle?: string;
  }

  interface MarkerOptions {
    icon?: Icon;
    enableDragging?: boolean;
    rotation?: number;
    title?: string;
    offset?: Size;
  }

  interface IconOptions {
    anchor?: Size;
    imageOffset?: Size;
    imageSize?: Size;
  }

  interface InfoWindowOptions {
    width?: number;
    height?: number;
    title?: string;
    maxWidth?: number;
    offset?: Size;
    enableCloseOnClick?: boolean;
    enableMessage?: boolean;
  }

  interface LabelOptions {
    position?: Point;
    offset?: Size;
    enableMassClear?: boolean;
    styles?: object;
  }

  class Control {
    constructor();
  }

  class ScaleControl extends Control {
    constructor(opts?: ScaleControlOptions);
  }

  class ZoomControl extends Control {
    constructor(opts?: ZoomControlOptions);
  }

  class NavigationControl extends Control {
    constructor(opts?: NavigationControlOptions);
  }

  class MapTypeControl extends Control {
    constructor(opts?: MapTypeControlOptions);
  }

  interface ControlOptions {
    anchor?: number;
    offset?: Size;
  }

  interface ScaleControlOptions extends ControlOptions {}
  interface ZoomControlOptions extends ControlOptions {}
  interface NavigationControlOptions extends ControlOptions {
    type?: number;
  }
  interface MapTypeControlOptions extends ControlOptions {}

  interface Overlay {}
}

interface Window {
  BMapGL: typeof BMapGL;
  BMap: typeof BMap;
  initBMap?: () => void;
}

declare module 'antd';
declare module '@ant-design/icons'; 