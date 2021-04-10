const ye = (...e) => {
	if (e === null) return;
	if (e.length === 1) e = e[0];
	if (typeof e.values === 'function') {
		const wrap = document.createElement('div');
		for (const value of [...e.values()]) wrap.appendChild(ye(value));
		return wrap;
	}
	if (e instanceof Element) {
		const wrap = document.createElement('div');
		wrap.appendChild(e);
		return wrap;
	}
	let re;
	const { a, c, d, i, id, n, s, sf, t, x } = e;
	if ( id || c || t ) {
		if ( n ) re = document.createElementNS( n, t );
		else re = document.createElement( t !== '' && t !== undefined ? t : 'div' );
		if ( id ) re.id = id;
		if ( c ) re.classList.add(...c);
	}
	else re = document.createElement('div');
	if (a) for (const [k, v] of Object.entries(a)) re.setAttribute(k, v);
	if (d) for (const [k, v] of Object.entries(d)) re.dataset[k] = v;
	if (s) for (const [k, v] of Object.entries(s)) re.style[k] = v;
	if (i)
		for (const j of i) {
			if (j instanceof Element) re.appendChild(j);
			else if (['string', 'number', 'bigint', 'boolean', 'symbol'].indexOf(typeof j) !== -1) re.innerHTML += '' + j;
			else if (['function', 'undefined'].indexOf(typeof j) === -1 && typeof j === 'object') re.appendChild(ye(j));
			else throw j + ' can not be used to create a DOMElement';
		}
	if (sf) {
		console.warn('Scoped Funtions are currently disabled in YE generator.\nSorry, please come back later.');
		console.log(sf);
	}
	if (x)
		for (const [k, v] of Object.entries(x)) {
			const ka = k.split(/\_\$/);
			if (ka.length > 1) re[ka[0]](...v);
			else re[k](...v);
		}
	return re;
};