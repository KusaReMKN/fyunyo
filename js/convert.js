'use strict';

export function // Promise<HTMLImageElement>
imageDataToImage(imgdata)
{
	return new Promise(r => {
		const cv = document.createElement('canvas');
		const ctx = cv.getContext('2d');
		cv.width = imgdata.width;
		cv.height = imgdata.height;
		ctx.putImageData(imgdata, 0, 0);
		const img = new Image();
		img.addEventListener('load', r(img));
		img.src = cv.toDataURL();
		cv.remove();
	});
}

export function // Promise<String>
fileToDataURL(file)
{
	return new Promise(r => {
		const reader = new FileReader();
		reader.addEventListener('load', () => r(reader.result));
		reader.readAsDataURL(file);
	});
}
