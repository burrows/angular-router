(function() {

describe('$router', function() {
  beforeEach(module('router'));

  beforeEach(module(function($routerProvider) {
    $routerProvider
      .route('fooIndex', '/foos')
      .route('barIndex', '/bars')
      .route('fooBarIndex', '/foos/bars')
      .route('fooShow', '/foos/:id')
      .route('search', '/search/:query/p:num')
      .route('file', '/file/*path')
      .route('twoSplats', '/foo/*splat1/bar/*splat2')
      .route('regAndSplat', '/foos/:id/*splat')
      .route('basic', '/basic(/opt)')
      .route('doc', '/docs/:section(/:subsection)');
  }));

  beforeEach(inject(function(_$rootScope_, _$location_, _$statechart_, _$router_) {
    $rootScope  = _$rootScope_;
    $location   = _$location_;
    $statechart = _$statechart_;
    $router     = _$router_;

    $location.path('/').search({});
    $statechart.goto();
    $router.start();
    $rootScope.$digest();

    spyOn($statechart, 'send');
  }));

  describe('with simple routes', function() {
    describe('upon a $location.path() change', function() {
      it('should send the didRouteTo action to the $statechart with the name of the matching route', function() {
        $location.path('/foos');
        $rootScope.$digest();
        expect($statechart.send).toHaveBeenCalledWith('didRouteTo', 'fooIndex', {}, {});

        $location.path('/foos/bars');
        $rootScope.$digest();
        expect($statechart.send).toHaveBeenCalledWith('didRouteTo', 'fooBarIndex', {}, {});
      });

      it('should pass along the search params', function() {
        $location.path('/foos').search({a: '1', b: '2'});
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'fooIndex', {}, {a: '1', b: '2'});
      });

      it("should send the didRouteToUnknown action to the $statechart if path doesn't match a known route", function() {
        $location.path('/blah');
        $rootScope.$digest();
        expect($statechart.send).toHaveBeenCalledWith('didRouteToUnknown', '/blah');
      });

      it('should send the didRouteToUnknown action to the $statechart if the didRouteTo action raises an exception', function() {
        var calls = [];

        $statechart.send = function(action) {
          calls.push([].slice.call(arguments));
          if (action === 'didRouteTo') { throw new Error; }
        };

        $location.path('/foos');
        $rootScope.$digest();

        expect(calls.length).toBe(2);
        expect(calls[0]).toEqual(['didRouteTo', 'fooIndex', {}, {}]);
        expect(calls[1]).toEqual(['didRouteToUnknown', '/foos']);
      });
    });

    describe('upon a $location.search() change', function() {
      it('should send the didRouteTo action to the $statechart with the name of the matching route and search params', function() {
        $location.path('/foos');
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'fooIndex', {}, {});

        $location.search({a: 'b', c: 'd'});
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'fooIndex', {}, {a: 'b', c: 'd'});
      });
    });
  });

  describe('with routes with named params', function() {
    describe('upon a $location.path() change', function() {
      it('should send the didRouteTo action to the $statechart with the name of the matching route and extracted param values', function() {
        $location.path('/foos/123');
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'fooShow', {id: '123'}, {});

        $location.path('/search/some-query/p4');
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'search',
            {query: 'some-query', num: '4'}, {});
      });

      it('should decode param values', function() {
        $location.path('/search/some%20query/p7');
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'search',
            {query: 'some query', num: '7'}, {});
      });
    });

    describe('upon a $location.search() change', function() {
      it('should send the didRouteTo action to the $statechart with the name of the matching route and search params', function() {
        $location.path('/foos/2');
        $rootScope.$digest();

        $location.search({a: 'b', c: 'd'});
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'fooShow', {id: '2'}, {a: 'b', c: 'd'});
      });
    });
  });

  describe('with routes with splat params', function() {
    describe('upon a $location.path() change', function() {
      it('should send the didRouteTo action to the $statechart with the name of the matching route and extracted splat param values', function() {
        $location.path('/file/some/long/path/thing');
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'file', {path: 'some/long/path/thing'}, {});

        $location.path('/foo/a/b/c/bar/d-e-f');
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'twoSplats',
            {splat1: 'a/b/c', splat2: 'd-e-f'}, {});
      });
    });
  });

  describe('with routes with regular and splat params', function() {
    describe('upon a $location.path() change', function() {
      it('should send the didRouteTo action to the $statechart with the name of the matching route and all extracted param values', function() {
        $location.path('/foos/123/a/bunch/of/stuff');
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'regAndSplat',
            {id: '123', splat: 'a/bunch/of/stuff'}, {});
      });
    });
  });

  describe('with routes with optional sections', function() {
    describe('upon a $location.path() change', function() {
      it('should match routes without optional segments', function() {
        $location.path('/basic');
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'basic', {}, {});

        $location.path('/docs/s1');
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'doc',
            {section: 's1', subsection: null}, {});
      });

      it('should match routes with optional segments', function() {
        $location.path('/basic/opt');
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'basic', {}, {});

        $location.path('/docs/s1/ss3');
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'doc',
            {section: 's1', subsection: 'ss3'}, {});
      });
    });
  });

  describe('.path', function() {
    it('should update $location.path() when given an argument', function() {
      $router.path('/foos/842');
      $rootScope.$digest();
      expect($location.path()).toBe('/foos/842');
    });

    it('should not cause the didRouteTo action to be sent to the statechart when given an argument', function() {
      $router.path('/foos/842');
      $rootScope.$digest();
      expect($statechart.send).not.toHaveBeenCalled();
    });

    it('should return the current path value when not given an argument', function() {
      expect($router.path()).toBe('/');
      $router.path('/foos/1');
      expect($router.path()).toBe('/foos/1');
    });
  });

  describe('.search', function() {
    it('should update $location.search() when given an argument', function() {
      $router.search({foo: '1', bar: '2'});
      $rootScope.$digest();
      expect($location.search()).toEqual({foo: '1', bar: '2'});
    });

    it('should not cause the didRouteTo action to be sent to the statechart when given an argument', function() {
      $router.search({a: 'b'});
      $rootScope.$digest();
      expect($statechart.send).not.toHaveBeenCalled();
    });

    it('should return the current search value when not given an argument', function() {
      expect($router.search()).toEqual({});
      $router.search({b: 'c'});
      expect($router.search()).toEqual({b: 'c'});
    });
  });

  describe('.replace', function() {
    it('should call $location.replace() during the digest cycle', function() {
      spyOn($location, 'replace');
      $router.replace().path('/foos/2');
      $rootScope.$digest();
      expect($location.replace).toHaveBeenCalled();
    });
  });

  describe('.stop', function() {
    it('should stop routing location changes', function() {
      $location.path('/foos');
      $rootScope.$digest();
      expect($statechart.send).toHaveBeenCalledWith('didRouteTo', 'fooIndex', {}, {});

      $router.stop();
      $location.path('/bars');
      $rootScope.$digest();
      expect($statechart.send).not.toHaveBeenCalledWith('didRouteTo', 'barIndex', {}, {});
    });
  });
});

}());

