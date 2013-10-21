angular.module('state', [])
  .value('$state', {})
  .factory('$statechart', function($log, $rootScope) {
    var slice = Array.prototype.slice, root = statechart.State.define();

    statechart.State.logger = $log;
    root.trace = true;

    $rootScope.action = function(name) {
      this.$emit.apply(this, ['action'].concat(slice.call(arguments)));
    };

    $rootScope.$on('action', function() {
      root.send.apply(root, slice.call(arguments, 1));
    });

    return root;
  });


