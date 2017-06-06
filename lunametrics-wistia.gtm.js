;(function(document, window, config) {

  'use strict';

  config = cleanConfig(config);

  var _wq = window._wq = window._wq || [];
  var handle = getHandler(config.syntax);
  var f, s;

  _wq.push({
    id: '_all',
    onReady: listenTo
  });

  if (isUndefined_(window.Wistia)) {

    f = document.getElementsByTagName('script')[0];
    s = document.createElement('script');
    s.src = '//fast.wistia.net/assets/external/E-v1.js';
    s.async = true;

    f.parentNode.insertBefore(s, f);

  }

  function listenTo(video) {

    var percentages = config._track.percentages;
    var eventNameDict = {
			'Play': 'play',
			'Pause': 'pause',
			'Watch to End': 'end'
		};
    var cache = {};

    forEach_(['Play', 'Watch to End'], function(key) {

      if (config.events[key]) {

        video.bind(eventNameDict[key], function() {

          handle(key, video);

        });

      }

    });

    if (config.events.Pause) {

      video.bind('pause', function() {

        if (video.percentWatched() !== 1) handle('Pause', video);

      });

    }

    if (percentages) {

      video.bind('secondchange', function(s) {

        var percentage = video.percentWatched();
        var key;

        for (key in percentages) {

          if (percentage >= percentages[key] && !cache[key]) {

            cache[key] = true;
            handle(key, video);

          }

        }

      });

    }

  }

  function cleanConfig(config) {

    config = extend_({}, {
      events: {
        'Play': true,
        'Pause': true,
        'Watch to End': true
      },
      percentages: {
        each: [],
        every: []
      }
    }, config);

    var key;
    var vals;

    forEach_(['each', 'every'], function(setting) {

      var vals = config.percentages[setting];

      if (!isArray_(vals)) vals = [vals];

      if (vals) config.percentages[setting] = map_(vals, Number);

    });

    var points = [].concat(config.percentages.each);

    if (config.percentages.every) {

      forEach_(config.percentages.every, function(val) {

        var n = 100 / val;
        var every = [];
        var i;

        for (i = 1; i < n; i++) every.push(val * i);

        points = points.concat(filter_(every, function(val) {

          return val > 0.0 && val < 100.0;

        }));

      });

    }

    var percentages = reduce_(points, function(prev, curr) {

      prev[curr + '%'] = curr / 100.0;
      return prev;

    }, {});

    config._track = {
      percentages: percentages
    };

    return config;

  }

  function getHandler(syntax) {

		syntax = syntax || {};

		var gtmGlobal = syntax.name || 'dataLayer';
    var uaGlobal = syntax.name || window.GoogleAnalyticsObject || 'ga';
    var clGlobal = '_gaq';
		var dataLayer;

    var handlers = {
      'gtm': function(state, video) {


        dataLayer.push({
          event: 'wistiaTrack',
          attributes: {
            videoAction: state,
            videoName: video.name()
          }
        });

      },
      'cl': function(state, video) {

        window[clGlobal].push(['_trackEvent', 'Videos', state, video.name()]);

      },
      'ua': function(state, video) {

        window[uaGlobal]('send', 'event', 'Videos', state, video.name());

      }
    };

		switch(syntax.type) {

			case 'gtm':

				dataLayer = window[gtmGlobal] = window[gtmGlobal] || [];
				break;

			case 'ua':

				window[uaGlobal] = window[uaGlobal] || function() {

					(window[uaGlobal].q = window[uaGlobal].q || []).push(arguments);

				};
				window[uaGlobal].l = +new Date();
				break;

			case 'cl':

				window[clGlobal] = window[clGlobal] || [];
				break;

			default:

				if (!isUndefined_(window[gtmGlobal])) {

					syntax.type = 'gtm';
					dataLayer = window[gtmGlobal] = window[gtmGlobal] || [];

				} else if (uaGlobal&& !isUndefined_(window[uaGlobal])) {

					syntax.type = 'ua';

				} else if (!isUndefined_(window[clGlobal]) && !isUndefined_(window[clGlobal].push)) {

					syntax.type = 'cl';

				}
				break;
		}

    return handlers[syntax.type];

  }

  function extend_() {

    var args = [].slice.call(arguments);
    var dst = args.shift();
    var src;
    var key;
    var i;

    for (i = 0; i < args.length; i++) {

      src = args[i];

      for (key in src) {

        dst[key] = src[key];

      }

    }

    return dst;

  }

  function isArray_(o) {

    if (Array.isArray_) return Array.isArray_(o);

    return Object.prototype.toString.call(o) === '[object Array]';

  }

  function forEach_(arr, fn) {

    if (Array.prototype.forEach_) return arr.forEach.call(arr, fn);

    var i;

    for (i = 0; i < arr.length; i++) {

      fn.call(window, arr[i], i, arr);

    }

  }

  function map_(arr, fn) {

    if (Array.prototype.map_) return arr.map.call(arr, fn);

    var newArr = [];

    forEach_(arr, function(el, ind, arr) {

      newArr.push(fn.call(window, el, ind, arr));

    });

    return newArr;

  }


  function filter_(arr, fn) {

    if (Array.prototype.filter) return arr.filter.call(arr, fn);

    var newArr = [];

    forEach_(arr, function(el, ind, arr) {

      if (fn.call(window, el, ind, arr)) newArr.push(el);

    });

    return newArr;

  }

  function reduce_(arr, fn, init) {

    if (Array.prototype.reduce) return arr.reduce.call(arr, fn, init);

    var result = init;
    var el;
    var i;

    for (i = 0; i < arr.length; i++) {

      el = arr[i];
      result = fn.call(window, result, el, arr, i);

    }

    return result;

  }

  function isUndefined_(thing) {

    return typeof thing === 'undefined';

  }

})(document, window, {
  'events': {
    'Play': true,
    'Pause': true,
    'Watch to End': true
  },
  'percentages': {
    'every': 25,
    'each': [10, 90]
  }
});
/*
 * Configuration Details
 *
 * @property events object
 * Defines which events emitted by YouTube API
 * will be turned into Google Analytics or GTM events
 *
 * @property percentages object
 * Object with configurations for percentage viewed events
 *
 *   @property each Array|Number|String
 *   Fires an event once each percentage ahs been reached
 *
 *   @property every Array|Number|String
 *   Fires an event for every n% viewed
 *
 * @property syntax object
 * Object with configurations for syntax
 *
 *   @property type ('gtm'|'cl'|'ua')
 *   Forces script to use GTM ('gtm'), Universal Analytics ('ul'), or
 *   Classic Analytics ('cl'); defaults to auto-detection
 *
 *   @property name string
 *   THIS IS USUALLY UNNECESSARY! Optionally instantiate command queue for syntax
 *   in question. Useful if the tracking library and tracked events can fire
 *   before GTM or Google Analytics can be loaded. Be careful with this setting
 *   if you're new to GA/GTM. GTM or Universal Analytics Only!
 */
/*
 * v1.0.1
 * Created by the Google Analytics consultants at http://www.lunametrics.com
 * Written by @notdanwilkerson
 * Documentation: https://github.com/lunametrics/wistia-google-analytics/
 * Licensed under the MIT License
 */