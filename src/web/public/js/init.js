/**
 * Early-load initialization script for the Armoury web app.
 *
 * Runs before React hydration to handle environment checks that must
 * execute synchronously in the <head>. Written in ES5 so it parses
 * in any browser — including the ones we want to warn.
 *
 * @requirements
 * 1. Must detect browsers that lack ES2022+ support (our browserslist floor).
 * 2. Must show a non-dismissible banner when the browser is incompatible.
 * 3. Must not block rendering or throw in any browser, including IE 11.
 * 4. Must be written in ES5 syntax — no arrow functions, template literals, const/let, or modern APIs.
 */
(function () {
    'use strict';

    /**
     * Detects whether the current browser supports the ES features
     * required by the application (ES2022+).
     *
     * Tests: globalThis, optional chaining, nullish coalescing,
     * Promise.allSettled, and structuredClone — all required by
     * our browserslist floor (Chrome 103+, Safari 15+, Firefox 115+).
     *
     * @returns {boolean} true if all feature checks pass.
     */
    function isModernBrowser() {
        try {
            /* globalThis (ES2020) */
            if (typeof globalThis === 'undefined') {
                return false;
            }

            /* Optional chaining + nullish coalescing (ES2020) */
            var test = Function('return ({a:{b:1}})?.a?.b ?? 0')();
            if (test !== 1) {
                return false;
            }

            /* Promise.allSettled (ES2020) */
            if (typeof Promise.allSettled !== 'function') {
                return false;
            }

            /* structuredClone (baseline 2022 — aligns with our Chrome 103+ floor) */
            if (typeof structuredClone !== 'function') {
                return false;
            }

            return true;
        } catch (e) {
            return false;
        }
    }

    /** Injects a fixed banner at the top of the page warning the user to update. */
    function showBanner() {
        var banner = document.createElement('div');
        banner.id = 'browser-compat-banner';
        banner.setAttribute('role', 'alert');
        banner.setAttribute(
            'style',
            'position:fixed;top:0;left:0;right:0;z-index:99999;' +
                'padding:12px 16px;' +
                'background:#b91c1c;color:#fff;' +
                'font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
                'text-align:center;',
        );
        banner.innerHTML =
            'Your browser is not supported. Please update to a recent version of ' +
            'Chrome, Firefox, Safari, or Edge for the best experience.';

        /* Insert as first child of <body> so it sits above all content. */
        if (document.body) {
            document.body.insertBefore(banner, document.body.firstChild);
        } else {
            /* Body not ready yet — wait for DOMContentLoaded. */
            document.addEventListener('DOMContentLoaded', function () {
                document.body.insertBefore(banner, document.body.firstChild);
            });
        }
    }

    if (!isModernBrowser()) {
        showBanner();
    }
})();
