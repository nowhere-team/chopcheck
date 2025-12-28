export type BboxCoords = [number, number, number, number] // [y_min, x_min, y_max, x_max]
export type Rotation = 0 | 90 | 180 | 270

export interface TransformedBbox {
	top: number
	left: number
	width: number
	height: number
}

/**
 * transforms bbox coordinates from original image space to rotated image space.
 * images are already rotated, but bbox coords are in original orientation.
 *
 * @param bbox - [y_min, x_min, y_max, x_max] in original image
 * @param rotation - how the image was rotated (clockwise)
 * @param originalWidth - width of original (unrotated) image
 * @param originalHeight - height of original (unrotated) image
 */
export function transformBboxForRotation(
	bbox: BboxCoords,
	rotation: Rotation,
	originalWidth: number,
	originalHeight: number
): TransformedBbox {
	const [yMin, xMin, yMax, xMax] = bbox

	switch (rotation) {
		case 0:
			return {
				top: yMin,
				left: xMin,
				width: xMax - xMin,
				height: yMax - yMin
			}

		case 90:
			// rotated 90° clockwise: (y, x) -> (x, H - y)
			// new dimensions: H x W
			return {
				top: xMin,
				left: originalHeight - yMax,
				width: yMax - yMin,
				height: xMax - xMin
			}

		case 180:
			// rotated 180°: (y, x) -> (H - y, W - x)
			return {
				top: originalHeight - yMax,
				left: originalWidth - xMax,
				width: xMax - xMin,
				height: yMax - yMin
			}

		case 270:
			// rotated 270° clockwise (= 90° counter-clockwise): (y, x) -> (W - x, y)
			return {
				top: originalWidth - xMax,
				left: yMin,
				width: yMax - yMin,
				height: xMax - xMin
			}

		default:
			return {
				top: yMin,
				left: xMin,
				width: xMax - xMin,
				height: yMax - yMin
			}
	}
}

/**
 * adds padding to bbox, clamping to image bounds
 */
export function addBboxPadding(
	bbox: TransformedBbox,
	padding: number,
	imageWidth: number,
	imageHeight: number
): TransformedBbox {
	const paddedTop = Math.max(0, bbox.top - padding)
	const paddedLeft = Math.max(0, bbox.left - padding)
	const paddedBottom = Math.min(imageHeight, bbox.top + bbox.height + padding)
	const paddedRight = Math.min(imageWidth, bbox.left + bbox.width + padding)

	return {
		top: paddedTop,
		left: paddedLeft,
		width: paddedRight - paddedLeft,
		height: paddedBottom - paddedTop
	}
}

/**
 * converts normalized bbox (0-1) to pixel coordinates
 */
export function denormalizeBbox(bbox: BboxCoords, width: number, height: number): BboxCoords {
	return [bbox[0] * height, bbox[1] * width, bbox[2] * height, bbox[3] * width]
}
