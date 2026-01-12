// file: services/frontend/src/lib/shared/bbox.ts
export type BboxCoords = [number, number, number, number] // [y_min, x_min, y_max, x_max] normalized 0-1000
export type Rotation = 0 | 90 | 180 | 270

export interface TransformedBbox {
	top: number // 0-1000
	left: number // 0-1000
	width: number // 0-1000
	height: number // 0-1000
}

/**
 * transforms normalized bbox (0-1000) from original image orientation to rotated.
 * works purely in normalized coordinates, no pixel conversion needed.
 */
export function transformBboxForRotation(bbox: BboxCoords, rotation: Rotation): TransformedBbox {
	const [yMin, xMin, yMax, xMax] = bbox

	switch (rotation) {
		case 0:
			return {
				left: xMin,
				top: yMin,
				width: xMax - xMin,
				height: yMax - yMin
			}

		case 90:
			// (y, x) -> (x, 1000 - y)
			return {
				left: yMin,
				top: 1000 - xMax,
				width: yMax - yMin,
				height: xMax - xMin
			}

		case 180:
			// (y, x) -> (1000 - y, 1000 - x)
			return {
				left: 1000 - xMax,
				top: 1000 - yMax,
				width: xMax - xMin,
				height: yMax - yMin
			}

		case 270:
			// (y, x) -> (1000 - x, y)
			return {
				left: 1000 - yMax,
				top: xMin,
				width: yMax - yMin,
				height: xMax - xMin
			}

		default:
			return {
				left: xMin,
				top: yMin,
				width: xMax - xMin,
				height: yMax - yMin
			}
	}
}

/**
 * adds padding to bbox in normalized coordinates (0-1000), clamping to bounds
 */
export function addBboxPadding(bbox: TransformedBbox, padding: number): TransformedBbox {
	return {
		left: Math.max(0, bbox.left - padding),
		top: Math.max(0, bbox.top - padding),
		width: Math.min(1000 - Math.max(0, bbox.left - padding), bbox.width + padding * 2),
		height: Math.min(1000 - Math.max(0, bbox.top - padding), bbox.height + padding * 2)
	}
}
