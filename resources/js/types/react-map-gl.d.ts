declare module 'react-map-gl' {
    import * as React from 'react';

    export type AnchorPosition =
        | 'center'
        | 'top'
        | 'bottom'
        | 'left'
        | 'right'
        | 'top-left'
        | 'top-right'
        | 'bottom-left'
        | 'bottom-right';

    export interface ViewState {
        latitude: number;
        longitude: number;
        zoom: number;
        bearing?: number;
        pitch?: number;
        [key: string]: unknown;
    }

    export interface MapLayerMouseEvent {
        lngLat: { lat: number; lng: number };
    }

    export interface MapProps extends ViewState {
        style?: React.CSSProperties;
        children?: React.ReactNode;
        mapStyle?: string;
        mapboxAccessToken?: string;
        onMove?: (event: { viewState: ViewState }) => void;
        onClick?: (event: MapLayerMouseEvent) => void;
    }

    export interface MarkerProps {
        latitude: number;
        longitude: number;
        anchor?: AnchorPosition;
        children?: React.ReactNode;
    }

    export interface NavigationControlProps {
        position?: string;
    }

    const Map: React.FC<MapProps>;
    export const Marker: React.FC<MarkerProps>;
    export const NavigationControl: React.FC<NavigationControlProps>;
    export type { ViewState, MapLayerMouseEvent };
    export default Map;
}
