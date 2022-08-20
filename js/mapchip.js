'use strict';

export async function // ImageData[]
fetchMapChip(src)
{
	const img = await new Promise(r => {
		const img = new Image();
		img.addEventListener('load', () => r(img));
		img.src = src;
	});
	const cv = document.createElement('canvas');
	const ctx = cv.getContext('2d');
	cv.width = img.width;
	cv.height = img.height;
	if (cv.width !== 256 || cv.height !== 256)
		console.warn('fetchMapChip: image size', img);
	ctx.drawImage(img, 0, 0);
	const res = [];
	for (let i = 0; i < cv.height; i += 16)
		for (let j = 0; j < cv.width; j += 16)
			res.push(ctx.getImageData(j, i, 16, 16));
	cv.remove();
	return res;
}
