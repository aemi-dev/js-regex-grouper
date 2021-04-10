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
    for (const { dataset } of document.querySelectorAll('input.regexp'))
      if (dataset.valid === 'false')
        return false;
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
      group.querySelector('.group.minus').disabled = groups[1] ? false : true;
      const regExps = group.getElementsByClassName('regexp-wrapper');
      for (const regExp of regExps) {
        regExp.querySelector('.regexp.minus').disabled = regExps[1] ? false : true;
        const iR = regExp.querySelector('input.regexp');
        const iF = regExp.querySelector('input.flags');
        const iRv = iR.value;
        const iFv = iF.value;
        if (iRv.length > 0) {
          let nR;
          try { nR = (iFv.length > 0) ? new RegExp(iRv, iFv) : new RegExp(iRv); }
          catch (error) { iR.dataset.valid = false; }
          if (nR instanceof RegExp) iR.dataset.valid = true;
        } else { iR.dataset.valid = false; }
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
    regExp: () => ye({
      t: '.regexp-wrapper',
      i: [
        { t: '.regexp-item-count', i: [] },
        { t: 'span.sep', i: ['&#x2F;'] },
        {
          t: 'input.regexp',
          a: { placeholder: 'Regular Expressions' },
          x: { addEventListener: ['input', checkRegExp, false] }
        },
        { t: 'span.sep', i: ['&#x2F;'] },
        {
          t: 'input.flags',
          a: { minlength: 0, maxlength: 6, placeholder: 'Flags' },
          x: { addEventListener: ['input', checkRegExp, false] }
        },
        {
          t: '.button-wrapper',
          i: [{
            t: 'button.regexp.plus.center',
            x: {
              addEventListener: ['click', ({ target }) => {
                target.closest('.regexp-wrapper').insertAdjacentElement('afterend', components.regExp());
                checkRegExp();
              }, false]
            }
          },
          {
            t: 'button.regexp.minus.center',
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
    regExpGroup: () => ye({
      t: '.group-wrapper',
      i: [{
        t: '.name-wrapper',
        i: [
          {
            t: 'input.group-focus',
            i: [],
            a: { type: 'checkbox', disabled: true },
            x: {
              addEventListener: [
                'click',
                () => {
                  if (window.strings.length > 0) {
                    const focused = [...document.getElementsByClassName('group-focus')].filter(item => item.checked);
                    const groups = [];
                    for (const one of focused || []) {
                      const wrapper = one.closest('.name-wrapper');
                      const { dataset } = wrapper.querySelector('input.group-name');
                      const { groupName, groupCode } = dataset;
                      groups[groups.length] = { name: groupName, code: groupCode };
                    }
                    window.query = { type: 'query', data: { groups: [...groups] } };
                    dispatchEvent(new Event('sendQuery'));
                  }
                }
              ]
            }
          },
          {
            t: 'input.group-name',
            a: { type: 'text', placeholder: 'Group Name' },
            d: { groupName: 'untitled', groupCode: parseInt(performance.now()) },
            x: {
              addEventListener: ['input', ({ target }) => {
                target.dataset.groupName = target.value.length > 0 ? target.value : 'untitled';
                checkRegExp();
              }]
            }
          },
          { t: '.group-item-count.center', i: [], a: { hidden: true } },
          {
            t: 'button.group.minus.center',
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
      { t: '.regexps', i: [components.regExp()] }
      ]
    }),
    /**
     * Add an entry in Strings table
     *
     * @param {object} item Source
     * @returns {Element} An HTML Element from item object
     */
    row: item => ye({
      t: 'tr',
      i: [
        { t: 'td.item-id', i: [item.id] },
        { t: 'td.item-text', i: [item.text] },
        { t: 'td.item-match', i: [`/${item.regExp.source || ''}/${item.regExp.flags || ''}`] },
        { t: 'td.item-group', i: [item.group.name] }
      ]
    }),
  };
  /**
   * Resize Item Column width in table
   * @returns {void}
   */
  const arrayItemContentWidthUpdate = () => {
    const table = document.getElementsByTagName('table')[0];
    const i = table.querySelector('.item-id-header').offsetWidth;
    const r = table.querySelector('.item-match-header').offsetWidth;
    const g = table.querySelector('.item-group-header').offsetWidth;
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
    let numberOfPages = Math.floor(length / limit) + (length % limit > 0 ? 1 : 0);
    let i = 0;
    selectPage.disabled = length === 0;
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
    if ( order !== undefined ) order = parseInt( order );
    if ( page !== undefined ) page = parseInt( page );
    if ( limit !== undefined ) limit = parseInt( limit );
    if ( length !== undefined ) length = parseInt( length );
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
    for (const group of (groups ? groups : window.groups)) {
      if (group.code) {
        const current = document.querySelector(`input.group-name[data-group-code="${group.code}"]`).closest('.name-wrapper');
        current.getElementsByClassName('group-focus')[0].disabled = false;
        const groupItemsCount = current.getElementsByClassName('group-item-count')[0];
        if (group.count > 0) {
          groupItemsCount.innerText = group.count;
          groupItemsCount.removeAttribute('hidden');
        } else {
          groupItemsCount.innerText = group.count;
          groupItemsCount.setAttribute('hidden', true);
        }
      }
    }
  };
  const worker = new Worker('./assets/scripts/worker.js');
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
    i: [
      {
        t: '.bar-wrapper',
        i: [
          { t: 'h1.web-app-title', i: ['URLs Grouper'], a: { hidden: true } },
          { t: 'button.button-shape#run.run', a: { disabled: true }, i: ['&#x25BA;'] }
        ]
      },
      { t: '.bar-wrapper', i: [] },
      {
        t: '.bar-wrapper.settings-wrapper',
        i: [
          {
            t: 'button.toggler.center', i: [],
            x: {
              addEventListener: ['click', ({ target }) => {
                target.classList.toggle('toggled');
                document.getElementsByClassName('settings-wrapper')[0].classList.toggle('toggled');
              }]
            }
          }, {
            t: '.wrapper',
            i: [
              {
                t: 'button.export.settings',
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
                        })))}`, download: `ug_${Date.now()}.settings.json`, hidden: ''
                      }
                    });
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    downloadLink.remove();
                  }, false]
                }
              },
              {
                t: 'button.export.groups',
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
      t: '.grid-column',
      i: [{
        t: `.input-section.center.${START_METHOD_SELECTED}`,
        i: [{
          t: '.methods.center',
          i: [
            { t: '.method.icon-text', i: ['Text'] },
            { t: '.method.icon-file', i: ['File'] }
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
          t: '.inputs',
          i: [{
            t: 'textarea.text#text-input.text-input.input',
            x: { addEventListener: ['input', () => run.disabled = !criteria()] }
          }, {
            t: '.file-input.input',
            i: [{
              t: 'input.file#file-input.custom',
              a: { name: 'file', type: 'file', disabled: true },
              x: { addEventListener: ['change', () => run.disabled = !criteria()] }
            }, {
              t: 'label#file-input-label.center',
              a: { for: 'file-input' },
              i: [{ t: 'span.icon.center' }, { t: 'span.text.center' }],
              x: {
                addEventListener_$drop: ['drop', event => event.preventDefault(), true],
                addEventListener_$dragEnter: ['dragenter', event => event.preventDefault(), true],
                addEventListener_$dragLeave: ['dragleave', event => event.preventDefault(), true]
              }
            }]
          }]
        }]
      }, {
        t: '.groups-section',
        i: [components.regExpGroup(), {
          t: 'button.new-group',
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
      t: '.grid-column',
      i: [{
        t: '.display-section',
        i: [{
          t: '.search-bar',
          i: [{
            t: 'input.matching-search',
            a: { disabled: true, type: 'text', placeholder: 'Search' },
            x: {
              addEventListener: ['input', ({ target }) => {
                window.query = { type: 'query', data: { match: target.value, unmatched: true } };
                dispatchEvent(new Event('sendQuery'));
              }]
            }
          },
          { t: '.count-unmatched.center', i: [''] },
          { t: '.count-total.center', i: [''] }]
        }, {
          t: '.array',
          i: [{
            t: 'table',
            i: [{
              t: 'thead',
              i: [{
                t: 'tr',
                i: [{
                  t: 'td.item-id-header#itemId',
                  i: ['ID'],
                  x: { addEventListener: ['click', () => { changeView({ prop: 'id' }); }] }
                }, {
                  t: 'td.item-text-header#itemText',
                  i: ['Text'],
                  x: { addEventListener: ['click', () => { changeView({ prop: 'text' }); }] }
                }, {
                  t: 'td.item-match-header#itemMatch',
                  i: ['Match'],
                  x: { addEventListener: ['click', () => { changeView({ prop: 'match' }); }] }
                }, {
                  t: 'td.item-group-header#itemGroup',
                  i: ['Group'],
                  x: { addEventListener: ['click', () => { changeView({ prop: 'group' }); }] }
                }]
              }]
            }]
          }]
        },
        {
          t: '.pagination#nav-through-strings',
          i: [
            {
              t: '.position',
              i: ['From ', { t: 'span#start-range', i: ['0'] }, ' to ', { t: 'span#end-range', i: ['0'] }]
            },
            {
              t: 'button#previous-items', i: ['Page pr&eacute;c&eacute;dente'],
              a: { disabled: true },
              x: { addEventListener: ['click', () => { changeView({ page: window.view.page - 1 }); }] }
            },
            { t: 'label', a: { for: 'select-page' }, i: ['Page : '] },
            {
              t: 'select#select-page', i: [{ t: 'option', i: ['1'], a: { value: 1, selected: true } }],
              a: { disabled: true },
              x: { addEventListener: ['input', ({ target }) => { changeView({ page: target.options[target.selectedIndex].value - 1 }); }] }
            },
            {
              t: 'button#next-items', i: ['Page suivante'],
              a: { disabled: true },
              x: { addEventListener: ['click', () => { changeView({ page: window.view.page + 1 }); }] }
            },
            { t: 'label', a: { for: 'change-limit' }, i: ['El&eacute;ments par page : '] },
            {
              t: 'select#change-limit', i: [
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
              x: { addEventListener: ['input', ({ target }) => { changeView({ limit: target.options[target.selectedIndex].value }); }] }
            },
          ]
        }]
      }]
    }]
  }));
  checkRegExp();
  arrayItemContentWidthUpdate();
  worker.addEventListener('message', ({ data }) => {
    switch (data.type) {
      case 'stringsParsed':
      case 'queryAnswered': { window.strings = data.data; displayStrings(); break; }
      case 'groupsUpdated': { displayCount(data.data); break; }
      case 'exp': {
        XLSX.writeFile(data.data, `Maillage - ${Date.now()}.xlsx`);
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
      const { dataset } = group.querySelector('input.group-name');
      const { groupName, groupCode } = dataset;
      const regExps = [...group.querySelectorAll('input.regexp')].map(rx => {
        if (rx.getAttribute('data-valid') === 'true')
          return {
            regExp: new RegExp(rx.value, rx.closest('.regexp-wrapper').querySelector('input.flags').value),
            count: 0
          };
      }).filter(r => r);
      return {
        name: groupName,
        code: groupCode,
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
