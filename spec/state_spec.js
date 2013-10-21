(function() {

describe('state module', function() {
  var $rootScope, $childScope, $statechart;

  beforeEach(module('state'));

  beforeEach(inject(function(_$rootScope_, _$statechart_) {
    $rootScope  = _$rootScope_;
    $childScope = $rootScope.$new();
    $statechart = _$statechart_;

    spyOn($statechart, 'send');
  }));

  describe('$rootScope.action', function() {
    it('should emit the "action" event', function() {
      var called;

      $rootScope.$on('action', function() {
        called = true;
      });

      $childScope.action('foo');
      expect(called).toBe(true);
    });

    it('should pass the action name when emitting the event', function() {
      var action;

      $rootScope.$on('action', function(event, a) {
        action = a;
      });

      $childScope.action('bar');
      expect(action).toBe('bar');
    });

    it('should forward all additional arguments when emitting the event', function() {
      var args;

      $rootScope.$on('action', function() {
        args = [].slice.call(arguments, 2);
      });

      $childScope.action('foo', 1, 'b', {c: 'd'});
      expect(args).toEqual([1, 'b', {c: 'd'}]);
    });
  });

  describe('$rootScope action event handler', function() {
    it('should forward the action on to the $statechart via the send method', function() {
      $childScope.action('baz');
      expect($statechart.send).toHaveBeenCalledWith('baz');
    });

    it('should forward the action arguments on to the $statechart', function() {
      $childScope.action('baz', 1, 2, 3);
      expect($statechart.send).toHaveBeenCalledWith('baz', 1, 2, 3);
    });
  });
});

}());

