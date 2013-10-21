angular.module('state', [])
  .value('$state', {})
  .factory('$statechart', function($log) {
    var root = statechart.State.define();
    statechart.State.logger = $log;
    root.trace = true;
    return root;
  });


