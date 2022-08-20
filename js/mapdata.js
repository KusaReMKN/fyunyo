'use strict';

export async function // {}
fetchMapData(src)
{
	const res = await fetch(src);
	return await res.json();
}
