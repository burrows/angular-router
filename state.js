angular.module('state', [])
  .value('$state', {})
  .factory('$statechart', function($log) {
    return statechart.State.define();
  });
