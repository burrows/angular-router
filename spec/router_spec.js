(function() {

describe('$router', function() {
  var $rootScope, $location, $statechart, $router;

  beforeEach(module('router'));

  describe('with simple routes', function() {
    beforeEach(module(function($routerProvider) {
      $routerProvider.route('fooIndex', '/foos');
      $routerProvider.route('barIndex', '/foos/bars');
    }));

    beforeEach(inject(function(_$rootScope_, _$location_, _$statechart_, _$router_) {
      $rootScope  = _$rootScope_;
      $location   = _$location_;
      $statechart = _$statechart_;
      $router     = _$router_;

      $router.start();

      spyOn($statechart, 'send');
    }));

    describe('upon a $location.path() change', function() {
      it('should send the didRouteTo action to the $statechart with the name of the matching route', function() {
        $location.path('/foos');
        $rootScope.$digest();
        expect($statechart.send).toHaveBeenCalledWith('didRouteTo', 'fooIndex', {}, {});

        $location.path('/foos/bars');
        $rootScope.$digest();
        expect($statechart.send).toHaveBeenCalledWith('didRouteTo', 'barIndex', {}, {});
      });

      it('should pass along the search params', function() {
        $location.path('/foos').search({a: '1', b: '2'});
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'fooIndex', {}, {a: '1', b: '2'});
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
    beforeEach(module(function($routerProvider) {
      $routerProvider.route('fooShow', '/foos/:id');
      $routerProvider.route('search', '/search/:query/p:num');
    }));

    beforeEach(inject(function(_$rootScope_, _$location_, _$statechart_, _$router_) {
      $rootScope  = _$rootScope_;
      $location   = _$location_;
      $statechart = _$statechart_;
      $router     = _$router_;

      $router.start();

      spyOn($statechart, 'send');
    }));

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
    beforeEach(module(function($routerProvider) {
      $routerProvider.route('file', '/file/*path');
      $routerProvider.route('twoSplats', '/foo/*splat1/bar/*splat2');
    }));

    beforeEach(inject(function(_$rootScope_, _$location_, _$statechart_, _$router_) {
      $rootScope  = _$rootScope_;
      $location   = _$location_;
      $statechart = _$statechart_;
      $router     = _$router_;

      $router.start();

      spyOn($statechart, 'send');
    }));

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
    beforeEach(module(function($routerProvider) {
      $routerProvider.route('foo', '/foos/:id/*splat');
    }));

    beforeEach(inject(function(_$rootScope_, _$location_, _$statechart_, _$router_) {
      $rootScope  = _$rootScope_;
      $location   = _$location_;
      $statechart = _$statechart_;
      $router     = _$router_;

      $router.start();

      spyOn($statechart, 'send');
    }));

    describe('upon a $location.path() change', function() {
      it('should send the didRouteTo action to the $statechart with the name of the matching route and all extracted param values', function() {
        $location.path('/foos/123/a/bunch/of/stuff');
        $rootScope.$digest();
        expect($statechart.send)
          .toHaveBeenCalledWith('didRouteTo', 'foo',
            {id: '123', splat: 'a/bunch/of/stuff'}, {});
      });
    });
  });

  describe('with routes with optional sections', function() {
    beforeEach(module(function($routerProvider) {
      $routerProvider.route('basic', '/foo(/bar)');
      $routerProvider.route('doc', '/docs/:section(/:subsection)');
    }));

    beforeEach(inject(function(_$rootScope_, _$location_, _$statechart_, _$router_) {
      $rootScope  = _$rootScope_;
      $location   = _$location_;
      $statechart = _$statechart_;
      $router     = _$router_;

      $router.start();

      spyOn($statechart, 'send');
    }));

    describe('upon a $location.path() change', function() {
      it('should match routes without optional segments', function() {
        $location.path('/foo');
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
        $location.path('/foo/bar');
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
});

}());

