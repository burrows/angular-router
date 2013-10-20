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
        var _path, _search;

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
              $statechart.send('didRouteTo', routes[i].name, params, search);
            }
          }
        }

        return {
          start: function() {
            _path   = $location.path();
            _search = $location.search();

            $rootScope.$watch(function() {
              return [$location.path(), $location.search()];
            }, function(v) { handleLocationChange(v[0], v[1]); }, true);

            $rootScope.$watch(function() { return [_path, _search]; },
              function(v) { $location.path(v[0]).search(v[1]); }, true);
          },

          stop: function() {
          },

          path: function(v) {
            if (arguments.length === 1) { _path = v || ''; return this; }
            else { return _path; }
          },

          search: function(v) {
            if (arguments.length === 1) { _search = v || {}; return this; }
            else { return _search; }
          }
        };
      }
    };
  });
