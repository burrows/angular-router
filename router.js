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
        var _path;

        function extractParams(route, path) {
          var vals = route.regex.exec(path).slice(1), params = {}, i, n;

          for (i = 0, n = route.names.length; i < n; i++) {
            params[route.names[i]] = vals[i] ? decodeURIComponent(vals[i]) : null;
          }

          return params;
        }

        function handleLocationChange(path, search) {
          var params, i, n;

          for (i = 0, n = routes.length; i < n; i++) {
            if ((match = routes[i].regex.exec(path))) {
              params = extractParams(routes[i], path);
              $statechart.send('didRouteTo', routes[i].name, params, search);
            }
          }
        }

        return {
          start: function() {
            // watch for changes to path and search - send to $statechart
            $rootScope.$watch(function() {
              return [$location.path(), $location.search()];
            }, function(val) {
              handleLocationChange(val[0], val[1]);
            }, true);

            // watch for changes to _path and search - sync to $location
          },

          stop: function() {
          },

          search: {},

          replace: function() { $location.replace(); },

          inform: function(path) { _path = path; return this; }
        };
      }
    };
  });
