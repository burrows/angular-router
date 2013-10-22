angular.module('router', ['state'])
  .factory('$router', function($rootScope, $location) {
    var routes           = [],
        namedParam       = /:(\w+)/g,
        splatParam       = /\*(\w+)/g,
        nameOrSplatParam = /[:*](\w+)/g,
        escapeRegex      = /[\-{}\[\]+?.,\\\^$|#\s]/g,
        _route           = null,
        _params          = {},
        _search          = {},
        eq               = angular.equals,
        unknownHandler, unwatch;

    function buildRegex(pattern) {
      var re = pattern
        .replace(escapeRegex, '\\$&')
        .replace(namedParam, '([^\/]*)')
        .replace(splatParam, '(.*?)');

      return new RegExp('^' + re + '$');
    }

    function extractNames(pattern) {
      var names = pattern.match(nameOrSplatParam) || [], i, n;
      for (i = 0, n = names.length; i < n; i++) {
        names[i] = names[i].slice(1);
      }
      return names;
    }

    function extractParams(route, path) {
      var vals = route.regex.exec(path).slice(1), params = {}, i, n;

      for (i = 0, n = route.names.length; i < n; i++) {
        params[route.names[i]] = vals[i] || null;
      }

      return params;
    }

    function generatePath(route, params) {
      return route.pattern.replace(nameOrSplatParam, function(_, name) {
        return params[name];
      });
    }

    function handleLocationChange(path, search) {
      var params, i, n;

      for (i = 0, n = routes.length; i < n; i++) {
        if ((match = routes[i].regex.exec(path))) {
          params = extractParams(routes[i], path);
          if (_route !== routes[i] || !eq(_params, params) || !eq(_search, search)) {
            _route  = routes[i];
            _params = extractParams(_route, path);
            _search = search;
            _route.callback(_params, _search);
          }
          return;
        }
      }

      if (unknownHandler) { unknownHandler(path, search); }
    }

    return {
      define: function(pattern, callback) {
        var route = {
          pattern: pattern,
          regex: buildRegex(pattern),
          names: extractNames(pattern),
          callback: callback
        };

        routes.push(route);

        return route;
      },

      unknown: function(callback) { unknownHandler = callback; return this; },

      start: function() {
        unwatch = $rootScope.$watch(function() {
          return [$location.path(), $location.search()];
        }, function(v) { handleLocationChange(v[0], v[1]); }, true);
        return this;
      },

      stop: function() {
        if (unwatch) { unwatch(); }
        unwatch = null;
        return this;
      },

      route: function(route) {
        if (arguments.length === 0) { return _route; }
        _route = route;
        if (_route) { $location.path(generatePath(_route, _params)); }
        return _route;
      },

      params: function(params, replace) {
        if (arguments.length === 0) { return _params; }
        _params = replace ? params : angular.extend(_params, params);
        if (_route) { $location.path(generatePath(_route, _params)); }
        return _params;
      },

      search: function(search, replace) {
        var k;
        if (arguments.length === 0) { return _search; }
        _search = replace ? search : angular.extend(_search, search);
        for (k in _search) { if (_search[k] === false) { delete _search[k]; } }
        $location.search(_search);
        return _search;
      },

      replace: function() { $location.replace(); return this; }
    };
  });
