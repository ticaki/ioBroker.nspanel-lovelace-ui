/* Search and mobile navigation of the documentation site. No dependencies. */
(function () {
    'use strict';
    // keep #anchor targets below the sticky header, whose height depends on the window width
    var header = document.querySelector('header');
    function fitScrollPadding() {
        if (header) {
            document.documentElement.style.scrollPaddingTop = header.offsetHeight + 12 + 'px';
        }
    }
    fitScrollPadding();
    window.addEventListener('resize', fitScrollPadding);
    // images above the target have no fixed size and load after the browser has jumped to the anchor,
    // so they push the heading out of view again (Firefox) - jump once more when everything is loaded
    function jumpToHash() {
        if (location.hash) {
            var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
            if (target) {
                target.scrollIntoView();
            }
        }
    }
    var userScrolled = false;
    ['wheel', 'touchmove', 'keydown', 'mousedown'].forEach(function (type) {
        window.addEventListener(
            type,
            function () {
                userScrolled = true;
            },
            { once: true, passive: true },
        );
    });
    jumpToHash();
    window.addEventListener('load', function () {
        if (!userScrolled) {
            jumpToHash();
        }
    });

    var toggle = document.getElementById('navToggle');
    var sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', function () {
            sidebar.classList.toggle('open');
        });
    }

    var input = document.getElementById('q');
    var box = document.getElementById('results');
    if (!input || !box) {
        return;
    }
    var index = null;
    var loading = false;

    function load() {
        if (index || loading) {
            return;
        }
        loading = true;
        fetch('search.json')
            .then(function (r) {
                return r.json();
            })
            .then(function (data) {
                index = data;
                loading = false;
                if (input.value) {
                    run();
                }
            })
            .catch(function () {
                loading = false;
            });
    }

    function score(page, needles) {
        var title = page.t.toLowerCase();
        var heads = page.h.join(' \n ').toLowerCase();
        var text = page.x.toLowerCase();
        var total = 0;
        for (var i = 0; i < needles.length; i++) {
            var n = needles[i];
            var s = 0;
            if (title.indexOf(n) >= 0) {
                s += 10;
            }
            if (heads.indexOf(n) >= 0) {
                s += 4;
            }
            if (text.indexOf(n) >= 0) {
                s += 1;
            }
            if (!s) {
                return 0;
            }
            total += s;
        }
        return total;
    }

    function hitHeading(page, needles) {
        for (var i = 0; i < page.h.length; i++) {
            var h = page.h[i].toLowerCase();
            for (var j = 0; j < needles.length; j++) {
                if (h.indexOf(needles[j]) >= 0) {
                    return page.h[i];
                }
            }
        }
        return '';
    }

    function run() {
        var term = input.value.trim().toLowerCase();
        if (term.length < 2 || !index) {
            box.hidden = true;
            box.innerHTML = '';
            return;
        }
        var needles = term.split(/\s+/);
        var hits = [];
        for (var i = 0; i < index.length; i++) {
            var s = score(index[i], needles);
            if (s > 0) {
                hits.push({ p: index[i], s: s });
            }
        }
        hits.sort(function (a, b) {
            return b.s - a.s;
        });
        hits = hits.slice(0, 20);
        box.innerHTML = '';
        if (!hits.length) {
            var none = document.createElement('div');
            none.className = 'none';
            none.textContent = (window.DOC_TEXT && window.DOC_TEXT.noHits) || 'No match';
            box.appendChild(none);
            box.hidden = false;
            return;
        }
        for (var k = 0; k < hits.length; k++) {
            var page = hits[k].p;
            var a = document.createElement('a');
            a.href = page.u;
            var t = document.createElement('span');
            t.className = 't';
            t.textContent = page.t;
            a.appendChild(t);
            var head = hitHeading(page, needles);
            if (head && head !== page.t) {
                var h = document.createElement('span');
                h.className = 'h';
                h.textContent = ' — ' + head;
                a.appendChild(h);
            }
            box.appendChild(a);
        }
        box.hidden = false;
    }

    input.addEventListener('focus', load);
    input.addEventListener('input', run);
    input.addEventListener('keydown', function (e) {
        var sel = box.querySelector('a.sel');
        if (e.key === 'Escape') {
            box.hidden = true;
            return;
        }
        if (e.key === 'Enter') {
            var target = sel || box.querySelector('a');
            if (target) {
                window.location.href = target.getAttribute('href');
            }
            return;
        }
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
            return;
        }
        e.preventDefault();
        var all = Array.prototype.slice.call(box.querySelectorAll('a'));
        if (!all.length) {
            return;
        }
        var pos = sel ? all.indexOf(sel) : -1;
        pos += e.key === 'ArrowDown' ? 1 : -1;
        if (pos < 0) {
            pos = all.length - 1;
        }
        if (pos >= all.length) {
            pos = 0;
        }
        if (sel) {
            sel.classList.remove('sel');
        }
        all[pos].classList.add('sel');
        all[pos].scrollIntoView({ block: 'nearest' });
    });
    document.addEventListener('click', function (e) {
        if (!box.contains(e.target) && e.target !== input) {
            box.hidden = true;
        }
    });
})();
