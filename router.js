angular.module('router', ['state'])
  .factory('$router', function($rootScope, $location) {
    var routes           = [],
        namedParam       = /:(\w+)/g,
        splatParam       = /\*(\w+)/g,
        nameOrSplatParam = /[:*](\w+)/g,
        escapeRegex      = /[\-{}\[\]+?.,\\\^$|#\s]/g,
        unknownHandler   = null,
        _route           = null,
        _params          = {},
        _search          = {},
        _replace         = false,
        modifiedRoute    = false,
        unwatch1, unwatch2;

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
        params[route.names[i]] = vals[i] ? decodeURIComponent(vals[i]) : null;
      }

      return params;
    }

    function generatePath(route, params) {
      return route.pattern.replace(nameOrSplatParam, function(_, name) {
        return params[name];
      });
    }

    function handleLocationChange(path, search) {
      var i, n;

      for (i = 0, n = routes.length; i < n; i++) {
        if ((match = routes[i].regex.exec(path))) {
          _route  = routes[i];
          _params = extractParams(_route, path);
          _search = search;
          _route.callback(_params, _search);
          return;
        }
      }

      if (unknownHandler) { unknownHandler(path, search); }
    }

    function handleRouteChange(route, params, search) {
      var path;

      if (!route) { return; }

      path = generatePath(route, params);
      $location.path(path).search(search);
      if (_replace) { $location.replace(); _replace = false; }
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
        unwatch1 = $rootScope.$watch(function() {
          return [$location.path(), $location.search()];
        }, function(v) {
          if (!modifiedRoute) { handleLocationChange(v[0], v[1]); }
        }, true);

        unwatch2 = $rootScope.$watch(function() {
          return [_route, _params, _search];
        }, function() {
          if (modifiedRoute) { handleRouteChange(_route, _params, _search); }
          modifiedRoute = false;
        }, true);

        return this;
      },

      stop: function() {
        unwatch1(); unwatch2();
        unwatch1 = unwatch2 = null;
        return this;
      },

      route: function(route) {
        if (arguments.length === 0) { return _route; }
        modifiedRoute = true;
        return _route = route;
      },

      params: function(params, replace) {
        if (arguments.length === 0) { return _params; }
        modifiedRoute = true;
        return replace ? _params = params : angular.extend(_params, params);
      },

      search: function(search, replace) {
        if (arguments.length === 0) { return _search; }
        modifiedRoute = true;
        return replace ? _search = search : angular.extend(_search, search);
      },

      replace: function() { _replace = true; return this; }
    };
  });
