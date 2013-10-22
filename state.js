(function() {

var State = statechart.State, slice = Array.prototype.slice;

angular.module('state', ['router'])
  .value('$state', {})
  .factory('$statechart', function($log, $router) {
    State.logger = $log;

    State.prototype.route = function(pattern) {
      var _this = this, handler, route;

      route = $router.define(pattern, function(params, search) {
        _this.root().goto(_this.path(), {
          context: angular.extend({}, params, search)
        });
      });

      this.enter(function() { $router.route(route); });

      return this;
    };

    State.prototype.params = function() {
      return $router.params.apply($router, slice.call(arguments));
    };

    State.prototype.search = function() {
      return $router.search.apply($router, slice.call(arguments));
    };

    State.prototype.replace = function() {
      $router.replace();
      return this;
    };

    State.prototype.unknown = function(f) {
      $router.unknown(f);
      return this;
    };

    return statechart.State.define();
  })
  .run(function($statechart, $rootScope) {
    var slice = Array.prototype.slice;

    $rootScope.action = function() {
      this.$emit.apply(this, ['action'].concat(slice.call(arguments)));
    };

    $rootScope.$on('action', function() {
      $statechart.send.apply($statechart, slice.call(arguments, 1));
    });
  });

}());
