(() => {
	"use strict";
	importScripts('./libs/sheetjs.min.js');
	let _g_ = [],
		_s_ = [],
		_sts = 0,
		_pts = 0;
	const parse = data => {
		_s_ = [];
		// Set unmatched items count to 0.
		let unmatched = 0;
		// Remove no-match group from groups
		_g_ = _g_.filter(({code}) => code !== 0);
		for ( const g of _g_ ) g.count = 0;
		// Decode data if it is an ArrayBuffer into a Array<String>
		if (data instanceof ArrayBuffer)
			data = (_ => _.split(/\n/))(new TextDecoder('utf-8').decode(new Uint8Array(data, 0)));
		// Process Iteration on all Data Entries
		for (const [id, el] of data.entries()) {
			// Set future object attributes
			let gC;
			let gN;
			let matched = false;
			let rx;
			let str = (typeof el === 'string' ? el : el.text);
			for (let { regExps, code, name, count } of _g_) {
				for (let { regExp } of regExps) {
					if (regExp.test(str)) {
						matched = true;
						gC = code;
						gN = name;
						rx = { flags: regExp.flags, source: regExp.source };
						count += 1;
						rx.count += 1;
						break;
					}
				}
				if (matched === true) break;
			}
			if (matched === false) {
				gC = 0;
				gN = 'no-match';
				rx = { flags: '', source: '' };
				unmatched += 1;
			}
			_s_[_s_.length] = {
				group: { code: gC, name: gN },
				id: id, regExp: rx, text: str
			};
		}
		_g_[_g_.length] = { name: 'no-match', code: 0, count: unmatched };
		self.postMessage({ type: 'stringsParsed', ok: true, data: _s_ });
		self.postMessage({ type: 'groupsUpdated', ok: true, data: _g_ });
		console.log(_s_);
		return;
	},
		answer = ({ match, groups, unmatched }) => {
			let search, str;
			if (match === '') match = undefined;
			if (groups === undefined) groups = [];
			if (match === undefined && groups.length === 0) {
				self.postMessage({ type: 'queryAnswered', ok: true, data: _s_ });
				return;
			}
			if (unmatched === true) str = _s_.filter(({group: { code }}) => code === 0);
			else str = _s_;
			if (match) {
				search = match;
				console.time(`Search ${search} Time`);
				str = str.filter(({ text }) => new RegExp(match).test(text));
			} else if (!unmatched && groups.length > 0) {
				const codes = groups.map(({ code }) => code);
				search = groups.map(({ name, code }) => `${name}:${code}`).join(', ');
				console.time(`Search ${search} Time`);
				str = str.filter(({ group: { code } }) => codes.indexOf(code) > -1);
			}
			self.postMessage({ type: 'queryAnswered', ok: true, data: str });
			self.postMessage({ type: 'groupsUpdated', ok: true, data: _g_ });
			console.timeEnd(`Search ${search} Time`);
		},
		exp = () => {
			let wb = XLSX.utils.book_new();
			wb.Props = {
				Title: "Etude Maillage",
				Subject: "Maillage",
				Author: "L'AgenceWeb.com",
				Company: "L'AgenceWeb.com",
				CreatedDate: new Date(2019, 5, 1)
			};
			wb.SheetNames.push("Maillage Parsing");
			wb.Sheets[wb.SheetNames[0]] = XLSX.utils.aoa_to_sheet([["ID", "Texte", "RegExp", "Groupe", "Code du Groupe"]]);
			XLSX.utils.sheet_add_json(wb.Sheets[wb.SheetNames[0]], _s_.map(({ id, text, regExp, group }) => ({
				id: id, text: text,
				regExp: (regExp.source !== '') ? `/${regExp.source}/${regExp.flags}` : '',
				groupName: group.name, groupCode: group.code
			})), {
					skipHeader: true,
					header: ["id", "text", "regExp", "groupName", "groupCode"],
					origin: "A2"
				});
			self.postMessage({ type: 'exp', data: wb });
		};
	self.addEventListener('message', ({ data }) => {
		if (data instanceof ArrayBuffer) parse(data);
		else switch (data.type) {
			case 'groups': { _g_ = data.groups; break; }
			case 'query': { answer(data.data); break; }
			case 'export': { exp(); break; }
			default: { break; }
		}
	});
})();
