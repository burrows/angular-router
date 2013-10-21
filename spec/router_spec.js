(function() {

describe('$router', function() {
  beforeEach(module('router'));

  beforeEach(module(function($routerProvider) {
    $routerProvider
      .route('/foos', ['/fooIndex'])
      .route('/bars', function() { return ['/barIndex']; })
      .route('/foos/bars', ['/fooBarIndex'])
      .route('/foos/:id', ['/fooShow'])
      .route('/search/:query/p:num', ['/searchResults'])
      .route('/file/*path', ['/fileShow'])
      .route('/foo/*splat1/bar/*splat2', ['/twoSplats'])
      .route('/foos/:id/*splat', ['/regAndSplat'])
      .route('/basic(/opt)', ['/basic'])
      .route('/docs/:section(/:subsection)', ['/showDoc'])
      .route('/variableStates/:x/:y', function(params, search) {
        return ['/foo/x/' + params.x, '/foo/y/' + params.y, '/foo/z/' + search.z];
      })
      .unknown('/unknownRoute');
  }));

  beforeEach(inject(function(_$rootScope_, _$location_, _$statechart_, _$router_) {
    $rootScope  = _$rootScope_;
    $location   = _$location_;
    $statechart = _$statechart_;
    $router     = _$router_;

    spyOn($statechart, 'goto');

    $location.path('/').search({});
    $statechart.goto();
    $router.start();
    $rootScope.$digest();
  }));

  describe('with simple routes', function() {
    describe('upon a $location.path() change', function() {
      it('should invoke goto on the $statechart with the states from the matching route', function() {
        $location.path('/foos');
        $rootScope.$digest();
        expect($statechart.goto).toHaveBeenCalledWith(['/fooIndex'], {
          context: {params: {}, search: {}}
        });

        $location.path('/foos/bars');
        $rootScope.$digest();
        expect($statechart.goto).toHaveBeenCalledWith(['/fooBarIndex'], {
          context: {params: {}, search: {}}
        });
      });

      it('should pass along the search params', function() {
        $location.path('/foos').search({a: '1', b: '2'});
        $rootScope.$digest();
        expect($statechart.goto).toHaveBeenCalledWith(['/fooIndex'], {
          context: {params: {}, search: {a: '1', b: '2'}}
        });
      });

      it('should invoke goto on the $statechart with the states returned from the states function', function() {
        $location.path('/bars');
        $rootScope.$digest();
        expect($statechart.goto).toHaveBeenCalledWith(['/barIndex'], {
          context: {params: {}, search: {}}
        });
      });

      it('should pass the params and search values to the states function', function() {
        $location.path('/variableStates/abc/def').search({z: 'hello'});
        $rootScope.$digest();
        expect($statechart.goto).toHaveBeenCalledWith(
          ['/foo/x/abc', '/foo/y/def', '/foo/z/hello'],
          {context: {params: {x: 'abc', y: 'def'}, search: {z: 'hello'}}}
        );
      });

      it("should invoke goto on the $statechart with the registered unknown state when the path doesn't match a known route", function() {
        $location.path('/blah');
        $rootScope.$digest();
        expect($statechart.goto).toHaveBeenCalledWith('/unknownRoute', {
          context: '/blah'
        });
      });

      it('should invoke goto on the $statechart if the goto to the matching routes raises an exception', function() {
        var calls = [];

        $statechart.goto = function(states) {
          calls.push([].slice.call(arguments));
          if (states[0] === '/fooIndex') { throw new Error; }
        };

        $location.path('/foos');
        $rootScope.$digest();

        expect(calls.length).toBe(2);
        expect(calls[0]).toEqual([['/fooIndex'], {context: {params: {}, search: {}}}]);
        expect(calls[1]).toEqual(['/unknownRoute', {context: '/foos'}]);
      });
    });

    describe('upon a $location.search() change', function() {
      it('should invoke the goto method on the $statechart with the states of the matching route and search params', function() {
        $location.path('/foos');
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/fooIndex'], {
            context: {params: {}, search: {}}
          });

        $location.search({a: 'b', c: 'd'});
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/fooIndex'], {
            context: {params: {}, search: {a: 'b', c: 'd'}}
          });
      });
    });
  });

  describe('with routes with named params', function() {
    describe('upon a $location.path() change', function() {
      it('should invoke the goto method the $statechart with the states of the matching route and extracted param values', function() {
        $location.path('/foos/123');
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/fooShow'], {
            context: {params: {id: '123'}, search: {}}
          });

        $location.path('/search/some-query/p4');
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/searchResults'], {
            context: {params: {query: 'some-query', num: '4'}, search: {}}
          });
      });

      it('should decode param values', function() {
        $location.path('/search/some%20query/p7');
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/searchResults'], {
            context: {params: {query: 'some query', num: '7'}, search: {}}
          });
      });
    });

    describe('upon a $location.search() change', function() {
      it('should invoke the goto method on the $statechart with the states of the matching route and search params', function() {
        $location.path('/foos/2');
        $rootScope.$digest();

        $location.search({a: 'b', c: 'd'});
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/fooShow'], {
            context: {params: {id: '2'}, search: {a: 'b', c: 'd'}},
          });
      });
    });
  });

  describe('with routes with splat params', function() {
    describe('upon a $location.path() change', function() {
      it('should invoke the goto method on the $statechart with the states of the matching route and extracted splat param values', function() {
        $location.path('/file/some/long/path/thing');
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/fileShow'], {
            context: {params: {path: 'some/long/path/thing'}, search: {}}
          });

        $location.path('/foo/a/b/c/bar/d-e-f');
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/twoSplats'], {
            context: {params: {splat1: 'a/b/c', splat2: 'd-e-f'}, search: {}}
          });
      });
    });
  });

  describe('with routes with regular and splat params', function() {
    describe('upon a $location.path() change', function() {
      it('should invoke the goto method on the $statechart with the states of the matching route and all extracted param values', function() {
        $location.path('/foos/123/a/bunch/of/stuff');
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/regAndSplat'], {
            context: {params: {id: '123', splat: 'a/bunch/of/stuff'}, search: {}}
          });
      });
    });
  });

  describe('with routes with optional sections', function() {
    describe('upon a $location.path() change', function() {
      it('should match routes without optional segments', function() {
        $location.path('/basic');
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/basic'], {
            context: {params: {}, search: {}}
          });

        $location.path('/docs/s1');
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/showDoc'], {
            context: {params: {section: 's1', subsection: null}, search: {}}
          });
      });

      it('should match routes with optional segments', function() {
        $location.path('/basic/opt');
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/basic'], {
            context: {params: {}, search: {}}
          });

        $location.path('/docs/s1/ss3');
        $rootScope.$digest();
        expect($statechart.goto)
          .toHaveBeenCalledWith(['/showDoc'], {
            context: {params: {section: 's1', subsection: 'ss3'}, search: {}}
          });
      });
    });
  });

  describe('.path', function() {
    it('should update $location.path() when given an argument', function() {
      $router.path('/foos/842');
      $rootScope.$digest();
      expect($location.path()).toBe('/foos/842');
    });

    it('should not cause goto to be called on the statechart when given an argument', function() {
      $statechart.goto.reset();
      $router.path('/foos/842');
      $rootScope.$digest();
      expect($statechart.goto).not.toHaveBeenCalled();
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

    it('should not cause the goto method to be called on the statechart when given an argument', function() {
      $statechart.goto.reset();
      $router.search({a: 'b'});
      $rootScope.$digest();
      expect($statechart.goto).not.toHaveBeenCalled();
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
      expect($statechart.goto)
        .toHaveBeenCalledWith(['/fooIndex'], {
          context: {params: {}, search: {}}
        });

      $router.stop();
      $location.path('/bars');
      $rootScope.$digest();
      expect($statechart.goto)
        .not.toHaveBeenCalledWith(['/barIndex'], {
          context: {params: {}, search: {}}
        });
    });
  });
});

}());

