'use strict';

import * as md from './mapdata.js';
import * as mc from './mapchip.js';
import * as cv from './convert.js';

let mapdata = {};
let msechip = [];
let mapchip = [];
let prevc = '';

function
resize(a)
{
	const t = [];
	for (let i = 0; i < +mapdata.h; i++) {
		const r = [];
		for (let j = 0; j < +mapdata.w; j++)
			r.push(a[i] && a[i][j] || 0);
		t.push(r);
	}
	return t;
}

function
resizeAll()
{
	mapdata.m = resize(mapdata.m);
	mapdata.i = resize(mapdata.i);
	mapdata.s = resize(mapdata.s);
	mapdata.e = resize(mapdata.e);
}

async function
update()
{
	mapw.value = mapdata.w;
	maph.value = mapdata.h;
	mapl.value = mapdata.l;
	mapt.value = mapdata.t;
	mapcimg.src = mapdata.c;
	mapp.options.length = 0;
	for (const i in mapdata.p) {
		const opt = document.createElement('option');
		opt.value = i;
		opt.textContent = (+i).toString(16).toUpperCase() + ': ';
		opt.textContent += mapdata.p[i].slice(0, 16);
		mapp.appendChild(opt);
	}
	resizeAll();
	mapptxt.value = mapdata.p[0];
	canvas.width = mapdata.w * 16;
	canvas.height = mapdata.h * 16;
	if (prevc !== mapdata.c) {
		mapchip = await mc.fetchMapChip(mapdata.c);
		prevc = mapdata.c;
	}
	const ctx = canvas.getContext('2d');
	for (let i = 0; i < +mapdata.h; i++)
		for (let j = 0; j < +mapdata.w; j++)
			ctx.putImageData(mapchip[mapdata.i[i][j]], j*16, i*16);
	ctx.save();
	ctx.globalCompositeOperation = 'destiantion-in';
	ctx.fillStyle = 'rgba(0, 0, 0, .5)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.restore();
	canvas.style.backgroundImage = `url('${canvas.toDataURL()}')`;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < +mapdata.h; i++)
		for (let j = 0; j < +mapdata.w; j++) {
			const layer = {
				'm': msechip[mapdata.m[i][j] + 0x00],
				'i': mapchip[mapdata.i[i][j]],
				's': msechip[mapdata.s[i][j] + 0x10],
				'e': msechip[mapdata.e[i][j] + 0x20],
			};
			ctx.putImageData(layer[sel.value], j*16, i*16);
		}
}

async function
init()
{
	msechip = await mc.fetchMapChip('./img/msechip.webp');
	datafile.addEventListener('change', async e => {
		const src = await cv.fileToDataURL(e.target.files[0]);
		mapdata = await md.fetchMapData(src);
		update();
	});
	writedata.addEventListener('click', () => {
		const blob = new Blob([ JSON.stringify(mapdata) ],
				{ type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `fyunyo-${Date.now()}.json`;
		a.click();
		a.remove();
	});
	mapw.addEventListener('change', e => {
		mapdata.w = +e.target.value;
		update();
	});
	maph.addEventListener('change', e => {
		mapdata.h = +e.target.value
		update();
	});
	mapl.addEventListener('change', e => mapdata.l = +e.target.value);
	mapt.addEventListener('change', e => mapdata.t = +e.target.value);
	mapc.addEventListener('change', async e => {
		const src = await cv.fileToDataURL(e.target.files[0]);
		mapcimg.src = src;
		mapdata.c = src;
		update();
	});
	mapcimg.addEventListener('click', e => {
		pen.value = e.offsetX >> 4 | e.offsetY >> 4 << 4;
	});
	mapp.addEventListener('change', e => {
		mapptxt.value = mapdata.p[+e.target.value];
	});
	mapptxt.addEventListener('input', e => {
		const i = mapp.value;
		mapdata.p[+i] = e.target.value;
		mapp.options[+i].textContent
				= (+i).toString(16).toUpperCase() + ': ';
		mapp.options[+i].textContent
				+= e.target.value.slice(0, 16);
	});
	sel.addEventListener('change', e => update());
	fill.addEventListener('click', e => {
		if (confirm('正気か？'))
			for (let i = 0; i < +mapdata.h; i++)
				for (let j = 0; j < +mapdata.w; j++)
					mapdata[sel.value][i][j] = +pen.value;
		update();
	});
	const drawer = () => {
		let px = 0;
		let py = 0;
		let pp = 0;
		return e => {
			const x = e.offsetX >> 4;
			const y = e.offsetY >> 4;
			if (e.buttons === 1) {
				mapdata[sel.value][y][x] = +pen.value;
				if (px !== x || py !== y || pp !== pen.value) {
					px = x;
					py = y;
					pp = pen.value;
					update();
				}
			}
		};
	};
	const filler = () => {
		const stack = [];
		return e => {
			const x = e.offsetX >> 4;
			const y = e.offsetY >> 4;
			const c = mapdata[sel.value][y][x];
			stack.push([x, y]);
			while (stack.length) {
				const [ x, y ] = stack.pop();
				if (0 <= x && x < mapdata.w
				    && 0 <= y && y < mapdata.h
				    && mapdata[sel.value][y][x] === c) {
					mapdata[sel.value][y][x] = +pen.value;
					stack.push([x - 1, y], [x, y - 1]);
					stack.push([x + 1, y], [x, y + 1]);
				}
			}
			update();
			e.preventDefault();
		};
	};
	canvas.addEventListener('contextmenu', filler());
	canvas.addEventListener('mousedown', drawer());
	canvas.addEventListener('mousemove', drawer());
	mapdata = await md.fetchMapData('./data/default.json');
	await update();
}

window.addEventListener('load', () => init());
