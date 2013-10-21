angular.module('router', ['state'])
  .provider('$router', function() {
    var routes           = [];
        optionalParam    = /\((.*?)\)/g,
        namedParam       = /(\(\?)?:\w+/g,
        splatParam       = /\*\w+/g,
        nameOrSplatParam = /[:*]\w+/g,
        escapeRegex      = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    function buildRegex(pattern) {
      var re = pattern
        .replace(escapeRegex, '\\$&')
        .replace(optionalParam, '(?:$1)?')
        .replace(namedParam, function(match, optional) {
          return optional ? match : '([^\/]+)';
        })
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

    return {
      route: function(name, pattern) {
        routes.push({
          name: name,
          regex: buildRegex(pattern),
          names: extractNames(pattern)
        });

        return this;
      },

      $get: function($rootScope, $location, $statechart) {
        var _replace = false, _path, _search, unwatch1, unwatch2;

        function extractParams(route, path) {
          var vals = route.regex.exec(path).slice(1), params = {}, i, n;

          for (i = 0, n = route.names.length; i < n; i++) {
            params[route.names[i]] = vals[i] ? decodeURIComponent(vals[i]) : null;
          }

          return params;
        }

        function handleLocationChange(path, search) {
          var params, i, n;

          if (path === _path && angular.equals(search, _search)) { return; }

          _path   = path;
          _search = search;

          for (i = 0, n = routes.length; i < n; i++) {
            if ((match = routes[i].regex.exec(path))) {
              params = extractParams(routes[i], path);
              try {
                $statechart.send('didRouteTo', routes[i].name, params, search);
              }
              catch (e) {
                $statechart.send('didRouteToUnknown', $location.url());
              }
              return;
            }
          }

          $statechart.send('didRouteToUnknown', $location.url());
        }

        return {
          start: function() {
            unwatch1 = $rootScope.$watch(function() {
              return [$location.path(), $location.search()];
            }, function(v) { handleLocationChange(v[0], v[1]); }, true);

            unwatch2 = $rootScope.$watch(function() {
              return [_path, _search];
            }, function(v) {
              $location.path(v[0]).search(v[1]);
              if (_replace) { $location.replace(); _replace = false; }
            }, true);
          },

          stop: function() {
            unwatch1(); unwatch2();
            unwatch1 = unwatch2 = null;
            return this;
          },

          path: function(v) {
            if (arguments.length === 1) { _path = v || ''; return this; }
            else { return _path; }
          },

          search: function(v) {
            if (arguments.length === 1) { _search = v || {}; return this; }
            else { return _search; }
          },

          replace: function() { _replace = true; return this; }
        };
      }
    };
  });
