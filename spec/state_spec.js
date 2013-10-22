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

  describe('$statechart', function() {
    it('should create a root state with no child states', function() {
      expect($statechart.root()).toBe($statechart);
      expect($statechart.substates).toEqual([]);
    });

    it('should set statechart.State.logger to the $log service', inject(function($log) {
      expect(statechart.State.logger).toBe($log);
    }));
  });

  describe('$state', function() {
    it('should be an empty object', inject(function($state) {
      expect($state).toEqual({});
    }));
  });

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

  describe('$router integration', function() {
    var $location, $router;

    beforeEach(inject(function(_$location_, _$router_) {
      $location = _$location_;
      $router = _$router_;

      $statechart.state('start', function() {
      });

      $statechart.state('index', function() {
        this.route('/foos');
      });

      $statechart.state('show', function() {
        this.route('/foos/:id');
        this.enter(function(ctx) {
          this.params({id: ctx.id});
        });
      });

      $statechart.goto();
      $router.start();
    }));

    afterEach(function() { $router.stop(); });

    describe('upon $location.path() changes', function() {
      it('should trigger a transition to the state with the matching route', function() {
        expect($statechart.current()).toEqual(['/start']);
        $location.path('/foos');
        $rootScope.$digest();
        expect($statechart.current()).toEqual(['/index']);

        $location.path('/foos/12');
        $rootScope.$digest();
        expect($statechart.current()).toEqual(['/show']);
      });
    });

    describe('upon entering a state with a defined route', function() {
      it('should update $location.path()', function() {
        expect($location.path()).toEqual('');
        expect($statechart.current()).toEqual(['/start']);

        $statechart.goto('/index');
        $rootScope.$digest();
        expect($location.path()).toEqual('/foos');

        $statechart.goto('/show', {context: {id: 9}});
        $rootScope.$digest();
        expect($location.path()).toEqual('/foos/9');
      });
    });
  });
});

}());

