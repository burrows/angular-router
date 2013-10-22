(function() {

describe('$router', function() {
  var $rootScope, $router, $location;

  beforeEach(module('router'));

  beforeEach(inject(function(_$rootScope_, _$router_, _$location_) {
    $rootScope = _$rootScope_;
    $router    = _$router_;
    $location  = _$location_;
    callback   = jasmine.createSpy('route callback');

    $location.path('/').search({});
    $router.start();
    $rootScope.$digest();
  }));

  describe('with simple routes', function() {
    var foosRoute, foosSpy, barsRoute, barsSpy, unknownSpy;

    beforeEach(function() {
      foosRoute = $router.define('/foos', foosSpy = jasmine.createSpy());
      barsRoute = $router.define('/bars', barsSpy = jasmine.createSpy());
      $router.unknown(unknownSpy = jasmine.createSpy());
    });

    describe('upon a $location.path() change', function() {
      it('should invoke the callback for the matched route and pass the extracted params and search objects', function() {
        $location.path('/foos');
        $rootScope.$digest();
        expect(foosSpy).toHaveBeenCalledWith({}, {});

        $location.path('/bars');
        $rootScope.$digest();
        expect(barsSpy).toHaveBeenCalledWith({}, {});
      });

      it('should pass along search params to the callback', function() {
        $location.path('/foos').search({a: '1', b: '2'});
        $rootScope.$digest();
        expect(foosSpy).toHaveBeenCalledWith({}, {a: '1', b: '2'});
      });

      it("should call the unknown callback if the path doesn't match any defined route", function() {
        $location.path('/nonexistant/path');
        $rootScope.$digest();
        expect(unknownSpy).toHaveBeenCalledWith('/nonexistant/path', {});
      });

      it('should update $router.route()', function() {
        expect($router.route()).toBeNull();
        $location.path('/foos');
        $rootScope.$digest();
        expect($router.route()).toBe(foosRoute);

        $location.path('/bars');
        $rootScope.$digest();
        expect($router.route()).toBe(barsRoute);
      });
    });

    describe('upon a $location.search() change', function() {
      it('should invoke the callback for the matched route and pass the extracted params and search objects', function() {
        $location.path('/foos');
        $rootScope.$digest();
        expect(foosSpy).toHaveBeenCalledWith({}, {});

        $location.search({a: 'b'});
        $rootScope.$digest();
        expect(foosSpy).toHaveBeenCalledWith({}, {a: 'b'});
      });

      it('should update $router.search()', function() {
        expect($router.search()).toEqual({});

        $location.path('/foos').search({foo: 'bar'});
        $rootScope.$digest();
        expect($router.search()).toEqual({foo: 'bar'});

        $location.path('/bars');
        $location.search({a: '1', b: '2'});
        $rootScope.$digest();
        expect($router.search()).toEqual({a: '1', b: '2'});
      });
    });
  });

  describe('with routes with named params', function() {
    var foosRoute, fooSpy, searchRoute, searchSpy;

    beforeEach(function() {
      foosRoute = $router.define('/foos/:id', fooSpy = jasmine.createSpy());
      searchRoute = $router.define('/search/:query/p:num', searchSpy = jasmine.createSpy());
    });

    describe('upon a $location.path() change', function() {
      it('should invoke the callback for the matched route and pass the extracted params and search objects', function() {
        $location.path('/foos/123');
        $rootScope.$digest();
        expect(fooSpy).toHaveBeenCalledWith({id: '123'}, {});

        $location.path('/search/some-query/p4');
        $rootScope.$digest();
        expect(searchSpy).toHaveBeenCalledWith({query: 'some-query', num: '4'}, {});
      });

      it('should update $router.route() and $router.params()', function() {
        expect($router.route()).toBeNull();
        $location.path('/foos/123');
        $rootScope.$digest();
        expect($router.route()).toBe(foosRoute);
        expect($router.params()).toEqual({id: '123'});

        $location.path('/search/abc/p12');
        $rootScope.$digest();
        expect($router.route()).toBe(searchRoute);
        expect($router.params()).toEqual({query: 'abc', num: '12'});
      });
    });

    describe('upon a $location.search() change', function() {
      it('should invoke the callback for the matched route and pass the extracted params and search objects', function() {
        $location.path('/foos/2');
        $rootScope.$digest();
        expect(fooSpy).toHaveBeenCalledWith({id: '2'}, {});

        $location.search({a: 'b', c: 'd'});
        $rootScope.$digest();
        expect(fooSpy).toHaveBeenCalledWith({id: '2'}, {a: 'b', c: 'd'});
      });
    });
  });

  describe('with routes with splat params', function() {
    var fileSpy, twoSplatSpy;

    beforeEach(function() {
      $router.define('/file/*path', fileSpy = jasmine.createSpy());
      $router.define('/foo/*splat1/bar/*splat2', twoSplatSpy = jasmine.createSpy());
    });

    describe('upon a $location.path() change', function() {
      it('should invoke the callback for the matched route and pass the extracted params and search objects', function() {
        $location.path('/file/some/long/path/thing');
        $rootScope.$digest();
        expect(fileSpy).toHaveBeenCalledWith({path: 'some/long/path/thing'}, {});

        $location.path('/foo/a/b/c/bar/d-e-f');
        $rootScope.$digest();
        expect(twoSplatSpy).toHaveBeenCalledWith({splat1: 'a/b/c', splat2: 'd-e-f'}, {});
      });
    });
  });

  describe('with routes with regular and splat params', function() {
    var spy;

    beforeEach(function() {
      $router.define('/foos/:id/*splat', spy = jasmine.createSpy());
    });

    describe('upon a $location.path() change', function() {
      it('should invoke the callback for the matched route and pass the extracted params and search objects', function() {
        $location.path('/foos/456/a/bunch/of/stuff');
        $rootScope.$digest();
        expect(spy).toHaveBeenCalledWith({id: '456', splat: 'a/bunch/of/stuff'}, {});
      });
    });
  });

  describe('$route methods', function() {
    var indexRoute, indexSpy, showRoute, showSpy, searchRoute, searchSpy;

    beforeEach(function() {
      indexRoute  = $router.define('/foos', indexSpy = jasmine.createSpy());
      showRoute   = $router.define('/foos/:id', showSpy = jasmine.createSpy());
      searchRoute = $router.define('/search/:query/p:num', searchSpy = jasmine.createSpy());
    });

    describe('.route', function() {
      it('should update $location.path() with the generated path when given a route object', function() {
        expect($location.path()).toBe('/');

        $router.route(indexRoute);
        $rootScope.$digest();
        expect($location.path()).toBe('/foos');

        $router.route(showRoute);
        $router.params({id: 9});
        $rootScope.$digest();
        expect($location.path()).toBe('/foos/9');
      });

      it("should not trigger the route's callback when given a route object", function() {
        $router.route(indexRoute);
        expect(indexSpy).not.toHaveBeenCalled();
      });

      it('should reuturn the current route when called with no arguments', function() {
        expect($router.route()).toBeNull();
        $router.route(indexRoute);
        expect($router.route()).toBe(indexRoute);
      });
    });

    describe('.params', function() {
      it('should update $location.path() when given an argument', function() {
        $router.route(showRoute);
        $router.params({id: 5});
        $rootScope.$digest();
        expect($location.path()).toEqual('/foos/5');

        $router.params({id: 6});
        $rootScope.$digest();
        expect($location.path()).toEqual('/foos/6');
      });

      it('should return the current params when not given an argument', function() {
        $router.route(indexRoute);
        $router.params({id: '1'});
        expect($router.params()).toEqual({id: '1'});
      });

      it('should merge given object with current params', function() {
        $router.route(searchRoute);
        $router.params({query: 'abc', num: '2'});
        $rootScope.$digest();
        expect($router.params()).toEqual({query: 'abc', num: '2'})
        expect($location.path()).toEqual('/search/abc/p2');

        $router.params({num: '3'});
        $rootScope.$digest();
        expect($router.params()).toEqual({query: 'abc', num: '3'})
        expect($location.path()).toEqual('/search/abc/p3');

        $router.params({query: 'blah'});
        $rootScope.$digest();
        expect($router.params()).toEqual({query: 'blah', num: '3'})
        expect($location.path()).toEqual('/search/blah/p3');
      });

      it('should replace existing params when passed true as the second argument', function() {
        $router.params({a: 'b', c: 'd'});
        expect($router.params()).toEqual({a: 'b', c: 'd'});

        $router.params({x: 'y'}, true);
        expect($router.params()).toEqual({x: 'y'});
      });
    });

    describe('.search', function() {
      it('should update $location.search() when given an argument', function() {
        $router.route(indexRoute);
        $router.search({foo: '1', bar: '2'});
        $rootScope.$digest();
        expect($location.search()).toEqual({foo: '1', bar: '2'});
      });

      it('should merge given object with current search params', function() {
        $router.route(indexRoute);
        $router.search({foo: '1', bar: '2'});
        $rootScope.$digest();
        expect($location.search()).toEqual({foo: '1', bar: '2'});

        $router.search({baz: '3'});
        $rootScope.$digest();
        expect($location.search()).toEqual({foo: '1', bar: '2', baz: '3'});
      });

      it('should replace existing search params when passed true as the second argument', function() {
        $router.route(indexRoute);
        $router.search({foo: '1', bar: '2'});
        $rootScope.$digest();
        expect($location.search()).toEqual({foo: '1', bar: '2'});

        $router.search({baz: '3'}, true);
        $rootScope.$digest();
        expect($location.search()).toEqual({baz: '3'});
      });

      it('should return the current search params when not given an argument', function() {
        $router.route(indexRoute);
        $router.search({foo: '1', bar: '2'});
        expect($router.search()).toEqual({foo: '1', bar: '2'});

        $router.search({baz: '3'});
        expect($router.search()).toEqual({foo: '1', bar: '2', baz: '3'});

        $router.search({abc: '123'}, true);
        expect($router.search()).toEqual({abc: '123'});
      });
    });

    describe('.replace', function() {
      it('should call $location.replace() during the digest cycle', function() {
        spyOn($location, 'replace');
        $router.route(indexRoute);
        $router.replace();
        $rootScope.$digest();
        expect($location.replace).toHaveBeenCalled();
      });
    });

    describe('.stop', function() {
      it('should stop routing location changes', function() {
        $location.path('/foos');
        $rootScope.$digest();
        expect(indexSpy).toHaveBeenCalled();
    
        $router.stop();
        $location.path('/foos/1');
        $rootScope.$digest();
        expect(showSpy).not.toHaveBeenCalled();
      });
    });
  });
});

}());

