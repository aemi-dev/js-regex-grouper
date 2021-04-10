((window, document, undefined) => {
  'use strict';
  console.time('Script Load Time');
  /**
   * Constants
   */
  const TEXT_INPUT_SELECTED = 'text-selected';
  const FILE_INPUT_SELECTED = 'file-selected';
  const START_METHOD_SELECTED = TEXT_INPUT_SELECTED;
  /**
   * Only Check RegExps Validity
   *
   * @returns {boolean} a regexp at least is invalid ? false : true
   */
  const checkRegExpValidity = () => {
    for (const { dataset: { valid } } of document.querySelectorAll('input.regexp'))
      if (valid === 'false') return false;
    return true;
  };
  /**
   * Check RegExps Validity and Disable/Enable Add/Remove Buttons for RegExp and Groups
   *
   * @return {void} Nothing
   */
  const checkRegExp = () => {
    const groups = document.getElementsByClassName('group-wrapper');
    for (const group of groups) {
      group.getElementsByClassName('group minus')[0].disabled = !groups[1];
      const regExps = group.getElementsByClassName('regexp-wrapper');
      for (const regExp of regExps) {
        regExp.getElementsByClassName('regexp minus')[0].disabled = !regExps[1];
        const iR = regExp.querySelector('input.regexp');
        const iF = regExp.querySelector('input.flags');
        const { value: iRv } = iR;
        const { value: iFv } = iF;
        let nR;
        if (iRv.length > 0) {
          try { nR = (iFv.length > 0) ? new RegExp(iRv, iFv) : new RegExp(iRv); }
          catch (error) { }
        }
        iR.dataset.valid = nR instanceof RegExp;
      }
    }
    dispatchEvent(new Event('RegExpChecked'));
  };
  /**
   * Shortcut for RegExp and Group of RegExp creation
   */
  const components = {
    /**
     * Create a RegExp Wrapper
     *
     * @returns {Element} RegExp Wrapper
     */
    regExp: (source,flags) => ye({
      c: ['regexp-wrapper'],
      i: [
        { c: ['regexp-item-count'], i: [] },
        { t: 'span', c: ['sep'], i: ['&#x2F;'] },
        {
          t: 'input',
          c: ['regexp'],
          a: { placeholder: 'Regular Expressions', value: source ? source : '' },
          x: { addEventListener: ['input', checkRegExp, false] },
          i: [ source ? source : '' ]
        },
        { t: 'span', c: ['sep'], i: ['&#x2F;'] },
        {
          t: 'input',
          c: ['flags'],
          a: { minlength: 0, maxlength: 6, placeholder: 'Flags', value: flags ? flags : '' },
          x: { addEventListener: ['input', checkRegExp, false] },
          i: [ flags ? flags : '' ]
        },
        {
          c: ['button-wrapper'],
          i: [{
            t: 'button',
            c: ['regexp', 'plus', 'center'],
            x: {
              addEventListener: ['click', ({ target }) => {
                target.closest('.regexp-wrapper').insertAdjacentElement('afterend', components.regExp());
                checkRegExp();
              }, false]
            }
          },
          {
            t: 'button',
            c: ['regexp', 'minus', 'center'],
            x: {
              addEventListener: ['click', ({ target }) => {
                target.closest('.regexp-wrapper').remove();
                checkRegExp();
              }, false]
            }
          }]
        }
      ]
    }),
    /**
     * Create a Group of RegExp
     *
     * @returns {Element} Group of RegExp
     */
    regExpGroup: ({name,code,regExps} = {}) => ye({
      c: ['group-wrapper'],
      i: [{
        c: ['name-wrapper'],
        i: [{
          t: 'input', c: ['group-focus'],
          a: { type: 'checkbox', disabled: true },
          x: {
            addEventListener: [
              'click',
              () => {
                if (window.strings.length > 0) {
                  const focused = [...document.getElementsByClassName('group-focus')].filter(({ checked }) => checked);
                  const groups = [];
                  for (const one of focused || []) {
                    const wrapper = one.closest('.name-wrapper');
                    const { dataset: { groupName: name, groupCode: code } } = wrapper.querySelector('input.group-name');
                    groups[groups.length] = { name: name, code: code };
                  }
                  window.query = { type: 'query', data: { groups: [...groups] } };
                  dispatchEvent(new Event('sendQuery'));
                }
              }
            ]
          }
        },
        {
          t: 'input',
          c: ['group-name'],
          a: { type: 'text', placeholder: 'Group Name' },
          d: { groupName: name ? name : 'untitled', groupCode: code ? code : parseInt(performance.now()) },
          x: {
            addEventListener: ['input', ({ target }) => {
              let { value } = target;
              target.dataset.groupName = value.length > 0 ? value : 'untitled';
              checkRegExp();
            }]
          },
          i: [ name ? name : '' ]
        },
        { c: ['group-item-count', 'center'], a: { hidden: true } },
        {
          t: 'button',
          c: ['group', 'minus', 'center'],
          i: ['Remove'],
          x: {
            addEventListener: ['click', ({ target }) => {
              target.closest('.group-wrapper').remove();
              checkRegExp();
            }, false]
          }
        }
        ]
      },
      {
        c:['regExps'],
        i: ( regExps && regExps.length > 0 ? regExps.map(({ regExp: {source,flags}}) => components.regExp(source,flags)) : [ components.regExp() ] )
      }
    ] } ),
    /**
     * Add an entry in Strings table
     *
     * @param {object} item Source
     * @returns {Element} An HTML Element from item object
     */
    row: ({ id, text, regExp: { source, flags }, group }) => ye({
      t: 'tr',
      i: [
        { t: 'td', c: ['item-id'], i: [id] },
        { t: 'td', c: ['item-text'], i: [text] },
        { t: 'td', c: ['item-match'], i: [`/${source || ''}/${flags || ''}`] },
        { t: 'td', c: ['item-group'], i: [group.name] }
      ]
    }),
  };
  /**
   * Resize Item Column width in table
   * @returns {void}
   */
  const arrayItemContentWidthUpdate = () => {
    const table = document.getElementsByTagName('table')[0];
    const i = table.getElementsByClassName('item-id-header')[0].offsetWidth;
    const r = table.getElementsByClassName('item-match-header')[0].offsetWidth;
    const g = table.getElementsByClassName('item-group-header')[0].offsetWidth;
    document.documentElement.style.setProperty('--item-text-max-width', `calc( ${document.documentElement.offsetWidth > 900 ? 50 : 100}vw - ${document.documentElement.offsetWidth > 900 ? 4.5 : 6}rem - ${parseInt(i + r + g)}px )`
    );
  };
  const updateRange = () => {
    const { start, end, limit, page, length } = window.view;
    const startRange = document.getElementById('start-range');
    const endRange = document.getElementById('end-range');
    const next = document.getElementById('next-items');
    const prev = document.getElementById('previous-items');
    const selectPage = document.getElementById('select-page');
    const changeLimit = document.getElementById('change-limit');
    let numberOfPages = Math.floor(length / limit) + (length % limit > 0 ? 1 : 0);
    let i = 0;
    selectPage.disabled = length === 0;
    changeLimit.disabled = length === 0;
    selectPage.innerHTML = '';
    for (let i = 0; i < numberOfPages; i += 1) {
      if (page === i) selectPage.appendChild(ye({ t: 'option', i: [parseInt(i + 1)], a: { value: i + 1, selected: true } }));
      else selectPage.appendChild(ye({ t: 'option', i: [parseInt(i + 1)], a: { value: i + 1 } }));
    }
    next.disabled = page === numberOfPages - 1;
    prev.disabled = page === 0;
    startRange.innerText = parseInt(start);
    endRange.innerText = parseInt(end - 1);
  };
  /**
   * Display Strings in Table
   * @param {Object[]} data
   * @param {Element} parent
   * @returns {void}
   */
  const displayStrings = (event, data = window.strings, parent = document.getElementsByTagName('table')[0]) => {
    event = null;
    let tbody = parent.getElementsByTagName('tbody')[0];
    let strings = [...data];
    let { prop, order, start, end } = window.view;
    if (tbody) tbody.remove();
    document.getElementsByClassName('count-total')[0].innerText = data.length;
    window.view.length = data.length;
    switch (prop) {
      case 'id': {
        strings = strings.sort((a, b) => order ? b.id - a.id : a.id - b.id);
        break;
      }
      case 'text': {
        strings = strings.sort((a, b) => order ? a.text < b.text ? 1 : a.text === b.text ? 0 : -1 : a.text > b.text ? 1 : a.text === b.text ? 0 : -1);
        break;
      }
      case 'match': {
        strings = strings.sort((a, b) => order ? a.regExp.source < b.regExp.source ? 1 : a.regExp.source === b.regExp.source ? 0 : -1 : a.regExp.source > b.regExp.source ? 1 : a.regExp.source === b.regExp.source ? 0 : -1);
        break;
      }
      case 'group': {
        strings = strings.sort((a, b) => order ? a.group.name < b.group.name ? 1 : a.group.name === b.group.name ? 0 : -1 : a.group.name > b.group.name ? 1 : a.group.name === b.group.name ? 0 : -1);
        break;
      }
    }
    strings = strings.slice(start, end);
    parent.appendChild(ye({ t: 'tbody', i: strings.map(item => components.row(item)) }));
    document.getElementsByClassName('matching-search')[0].disabled = false;
    arrayItemContentWidthUpdate();
    updateRange();
  };
  /**
   * Change View parameters to display strings in table
   * @param {Object} next
   * @returns {Object} New View
   */
  const changeView = ({ prop, order, page, limit, length }) => {
    const { view } = window;
    let start, end;
    if (order !== undefined) order = parseInt(order);
    if (page !== undefined) page = parseInt(page);
    if (limit !== undefined) limit = parseInt(limit);
    if (length !== undefined) length = parseInt(length);
    // What is the correct order ?
    if (prop === view.prop && page === undefined && limit === undefined)
      order = !order ? (view.order === 0 ? 1 : 0) : order;
    else order = (limit || page) ? (!order ? 0 : order) : (!order ? view.order : order);
    // was the sort property edited ?
    if (prop === undefined) prop = view.prop;
    // Should we crrect the page number ?
    if (page === undefined)
      if ((prop !== view.prop) || (order !== view.order) || (limit === undefined && limit !== view.limit)) page = 0;
      else page = view.page;
    else if (page > (Math.floor(length / limit) + (length % limit > 0 ? 1 : 0))) page = 0;
    // Check Limit
    if (limit === undefined) limit = view.limit;
    // Setting Start Index
    start = page * limit;
    // Setting End Index
    end = start + limit;
    window.view = { prop: prop, order: order, page: page, start: start, end: end, limit: limit };
    window.dispatchEvent(new Event('viewChanged'));
    return window.view;
  };
  /**
   * Display count of items per groups
   * @param {Object[]} groups
   * @returns {void}
   */
  const displayCount = groups => {
    for (const { code, count } of (groups ? groups : window.groups)) {
      if (code) {
        const current = document.querySelector(`input.group-name[data-group-code="${code}"]`).closest('.name-wrapper');
        current.getElementsByClassName('group-focus')[0].disabled = false;
        const groupItemsCount = current.getElementsByClassName('group-item-count')[0];
        if (count > 0) {
          groupItemsCount.innerText = count;
          groupItemsCount.removeAttribute('hidden');
        } else {
          groupItemsCount.innerText = count;
          groupItemsCount.setAttribute('hidden', true);
        }
      }
    }
  };
  const worker = new Worker('./assets/scripts/worker.js');


  const importReader = new FileReader();
  const loadSettings = ({ files, result }) => {
    if (result) {
      const newSettings = JSON.parse(result);
      for ( const group of document.getElementsByClassName('group-wrapper')) group.remove();
      for ( let newGroup of newSettings ) {
        document.getElementsByClassName('groups-section')[0].lastElementChild.insertAdjacentElement( 'beforebegin', components.regExpGroup(newGroup));
      }
    } else if (files[0]) importReader.readAsText(files[0]);
  };
  importReader.addEventListener('loadend', () => { loadSettings(importReader); });
  let st;
  let fi;
  let fr;
  let run;
  let criteria;
  window.strings = [];
  window.groups = [];
  window.view = {
    prop: 'id',
    order: 0,
    page: 0,
    start: 0,
    end: 100,
    limit: 100,
    length: 0
  };
  window.query = {};
  document.body.append(ye({
    t: 'header',
    i: [{
      c: ['bar-wrapper'],
      i: [
        { t: 'h1', c: ['web-app-title'], i: ['URLs Grouper'], d: { screenReaderOnly: true } },
        { t: 'button', id: 'run', c: ['button-shape', 'run'], a: { disabled: true }, i: ['&#x25BA;'] }
      ]
    },
    { c: ['bar-wrapper'], i: [] },
    {
      c: ['bar-wrapper', 'settings-wrapper'],
      i: [{
        t: 'button', c: ['toggler', 'center'], i: [],
        x: {
          addEventListener: ['click', ({ target }) => {
            target.classList.toggle('toggled');
            document.getElementsByClassName('settings-wrapper')[0].classList.toggle('toggled');
          }]
        }
      }, {
        c: ['wrapper'],
        i: [{
          t: 'button',
          c: ['export', 'settings'],
          i: ['Export Settings'],
          x: {
            addEventListener: ['click', () => {
              const downloadLink = ye({
                t: 'a',
                a: {
                  href: `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(window.groups.map(g => {
                    delete g.count;
                    for (let r of g.regExps) {
                      r.regExp = { source: r.regExp.source, flags: r.regExp.flags };
                      delete r.count;
                    }
                    return g;
                  })))}`, download: `ug_${Date.now()}.settings.json`, hidden: true
                }
              });
              document.body.appendChild(downloadLink);
              downloadLink.click();
              downloadLink.remove();
            }, false]
          }
        },
        {
          t: 'input',
          c: ['export', 'settings'],
          i: ['Import Settings'],
          a: { type: 'file' },
          x: {
            addEventListener: ['input', ({ target, preventDefault }) => {
              if (confirm('Would you realy erase previous file ?')) {
                loadSettings(target);
              } else preventDefault();
            }]
          }
        },
        {
          t: 'button', c: ['export', 'groups'],
          i: ['Export Groups'],
          x: {
            addEventListener: ['click', () => {
              console.time('Start XSLX Writing');
              worker.postMessage({ type: 'export' });
            }]
          }
        }
        ]
      }]
    }]
  }), ye({
    t: 'main',
    i: [{
      c: ['grid-column'],
      i: [{
        c: ['input-section', 'center', START_METHOD_SELECTED],
        i: [{
          c: ['methods', 'center'],
          i: [
            { c: ['method', 'icon-text'], i: ['Text'] },
            { c: ['method', 'icon-file'], i: ['File'] }
          ],
          x: {
            addEventListener_$SwitchInput: ['click', ({ target }) => {
              const section = target.closest('.input-section');
              st.disabled = fi.disabled;
              fi.disabled = !st.disabled;
              section.classList.toggle(FILE_INPUT_SELECTED);
              section.classList.toggle(TEXT_INPUT_SELECTED);
              run.disabled = !criteria();
            }, false]
          }
        }, {
          c: ['inputs'],
          i: [{
            t: 'textarea',
            id: 'text-input',
            c: ['text', 'text-input', 'input'],
            x: { addEventListener: ['input', () => run.disabled = !criteria()] }
          }, {
            c: ['file-input', 'input'],
            i: [{
              t: 'input',
              id: 'file-input',
              c: ['file', 'custom'],
              a: { name: 'file', type: 'file', disabled: true },
              x: { addEventListener: ['change', () => run.disabled = !criteria()] }
            }, {
              t: 'label',
              id: 'file-input-label',
              c: ['center'],
              a: { for: 'file-input' },
              i: [{ t: 'span', c: ['icon', 'center'] }, { t: 'span', c: ['text', 'center'] }],
              x: {
                addEventListener_$drop: ['drop', event => event.preventDefault(), true],
                addEventListener_$dragEnter: ['dragenter', event => event.preventDefault(), true],
                addEventListener_$dragLeave: ['dragleave', event => event.preventDefault(), true]
              }
            }]
          }]
        }]
      }, {
        c: ['groups-section'],
        i: [components.regExpGroup(), {
          t: 'button',
          c: ['new-group'],
          i: ['Add Group'],
          x: {
            addEventListener: ['click', ({ target }) => {
              const lastGroup = [...target.closest('.groups-section').getElementsByClassName('group-wrapper')].pop();
              if (lastGroup) lastGroup.insertAdjacentElement('afterend', components.regExpGroup());
              else target.insertAdjacentElement('beforebegin', components.regExpGroup());
              checkRegExp();
            }, false]
          }
        }]
      }]
    }, {
      c: ['grid-column'],
      i: [{
        c: ['display-section'],
        i: [{
          c: ['search-bar'],
          i: [{
            t: 'input',
            c: ['matching-search'],
            a: { disabled: true, type: 'text', placeholder: 'Search' },
            x: {
              addEventListener: ['input', ({ target: { value } }) => {
                window.query = { type: 'query', data: { match: value, unmatched: true } };
                dispatchEvent(new Event('sendQuery'));
              }]
            }
          },
          { c: ['count-unmatched', 'center'] },
          { c: ['count-total', 'center'] }]
        }, {
          c: ['array'],
          i: [{
            t: 'table',
            i: [{
              t: 'thead',
              i: [{
                t: 'tr',
                i: [{
                  t: 'td', c: ['item-id-header'], id: 'itemId',
                  i: ['ID'],
                  x: { addEventListener: ['click', () => { if (window.strings[0]) changeView({ prop: 'id' }); }] }
                }, {
                  t: 'td', c: ['item-text-header'], id: 'itemText',
                  i: ['Text'],
                  x: { addEventListener: ['click', () => { if (window.strings[0]) changeView({ prop: 'text' }); }] }
                }, {
                  t: 'td', c: ['item-match-header'], id: 'itemMatch',
                  i: ['Match'],
                  x: { addEventListener: ['click', () => { if (window.strings[0]) changeView({ prop: 'match' }); }] }
                }, {
                  t: 'td', c: ['item-group-header'], id: 'itemGroup',
                  i: ['Group'],
                  x: { addEventListener: ['click', () => { if (window.strings[0]) changeView({ prop: 'group' }); }] }
                }]
              }]
            }]
          }]
        },
        {
          c: ['pagination'], id: 'pagination',
          i: [{
            c: ['position'],
            i: ['From ', { t: 'span', id: 'start-range', i: ['0'] }, ' to ', { t: 'span', id: 'end-range', i: ['0'] }]
          },
          {
            i: [{
              t: 'button', id: 'previous-items', c: ['nav-page'], i: ['&larr;'],
              a: { disabled: true },
              x: { addEventListener: ['click', () => { changeView({ page: window.view.page - 1 }); }] }
            },
            { t: 'label', a: { for: 'select-page' }, i: ['Page'], d: { screenReaderOnly: true } },
            {
              t: 'select', id: 'select-page', i: [{ t: 'option', i: ['1'], a: { value: 1, selected: true } }],
              a: { disabled: true },
              x: { addEventListener: ['input', ({ target: { options, selectedIndex } }) => { changeView({ page: options[selectedIndex].value - 1 }); }] }
            },
            {
              t: 'button', id: 'next-items', c: ['nav-page'], i: ['&rarr;'],
              a: { disabled: true },
              x: { addEventListener: ['click', () => { changeView({ page: window.view.page + 1 }); }] }
            }]
          },
          {
            i: [{
              t: 'select', id: 'change-limit', i: [
                { t: 'option', i: ['10'], a: { value: 10 } },
                { t: 'option', i: ['25'], a: { value: 25 } },
                { t: 'option', i: ['50'], a: { value: 50 } },
                { t: 'option', i: ['100'], a: { value: 100, selected: true } },
                { t: 'option', i: ['250'], a: { value: 250 } },
                { t: 'option', i: ['500'], a: { value: 500 } },
                { t: 'option', i: ['1000'], a: { value: 1000 } },
                { t: 'option', i: ['2500'], a: { value: 2500 } },
                { t: 'option', i: ['5000'], a: { value: 5000 } },
              ],
              a: { disabled: true },
              x: { addEventListener: ['input', ({ target: { options, selectedIndex } }) => { changeView({ limit: options[selectedIndex].value }); }] }
            },
            { t: 'label', c: ['items-page'], a: { for: 'change-limit' }, i: [' items per view'] }]
          }
          ]
        }]
      }]
    }]
  }));
  checkRegExp();
  arrayItemContentWidthUpdate();
  worker.addEventListener('message', ({ data: { type, data } }) => {
    switch (type) {
      case 'stringsParsed':
      case 'queryAnswered': { window.strings = data; displayStrings(); break; }
      case 'groupsUpdated': { displayCount(data); break; }
      case 'exp': {
        XLSX.writeFile(data, `Maillage - ${Date.now()}.xlsx`);
        console.timeEnd('Start XSLX Writing');
        break;
      }
      default: break;
    }
  });
  st = document.getElementById('text-input');
  fi = document.getElementById('file-input');
  run = document.getElementById('run');
  fr = new FileReader();
  /**
   * Check if process is runnable
   * @returns {boolean}
   */
  criteria = () => (checkRegExpValidity() && window.groups.length > 0 ? (fi.disabled ? (st.value.length > 0 ? true : false) : (fi.files[0] instanceof File ? true : false)) : false);
  window.addEventListener('resize', arrayItemContentWidthUpdate);
  window.addEventListener('RegExpChecked', () => {
    groups = [...document.getElementsByClassName('group-wrapper')].map(group => {
      const { dataset: { groupName: name, groupCode: code } } = group.querySelector('input.group-name');
      const regExps = [...group.querySelectorAll('input.regexp')].map(rx => {
        if (rx.getAttribute('data-valid') === 'true')
          return {
            regExp: new RegExp(rx.value, rx.closest('.regexp-wrapper').querySelector('input.flags').value),
            count: 0
          };
      }).filter(r => r);
      return {
        name: name,
        code: code,
        regExps: regExps,
        count: 0
      };
    });
    worker.postMessage({ type: 'groups', groups: groups });
    run.disabled = !criteria();
  });
  window.addEventListener('viewChanged', displayStrings);
  window.addEventListener('sendQuery', () => { worker.postMessage(window.query); });
  run.addEventListener('click', () => {
    console.clear();
    if (!fi.disabled && fi.files[0])
      fr.readAsArrayBuffer(fi.files[0]);
    else if (!st.disabled && st.value.length > 0) {
      const { buffer } = new TextEncoder('utf-8').encode(st.value);
      worker.postMessage(buffer, [buffer]);
    }
  });
  fr.addEventListener('loadend', () => worker.postMessage(fr.result, [fr.result]));
})(window, document, undefined);
console.timeEnd('Script Load Time');
