angular.module('state', [])
  .value('$state', {})
  .factory('$statechart', function($log) {
    statechart.State.logger = $log;
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
