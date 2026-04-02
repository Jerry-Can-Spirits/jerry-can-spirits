// export {} makes this a module, enabling the declare module augmentations below
export {}


declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number] | [number, number, number]>,
    options?: {
      minOpacity?: number
      maxZoom?: number
      max?: number
      radius?: number
      blur?: number
      gradient?: Record<number, string>
    }
  ): Layer
}
