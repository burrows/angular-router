window.campaigns = [
  {id: 0, name: 'Campaign 0'},
  {id: 1, name: 'Campaign 1'},
  {id: 2, name: 'Campaign 2'},
  {id: 3, name: 'Campaign 3'},
  {id: 4, name: 'Campaign 4'}
];

angular.module('app', ['state', 'router'])
  .config(function($routerProvider) {
    $routerProvider
      .route('default', '')
      .route('campaigns', '/(campaigns)')
      .route('campaignShow', '/campaigns/:id');
  })

  .run(function($rootScope, $statechart, $state, $router, $location) {
    $statechart.trace = true;

    $statechart.state('start');

    $statechart.state('index', function() {
      this.enter(function() {
        $router.path('/campaigns').search({});
        $state.contentTmpl = 'index.html';
      });

      this.action('didSelectCampaign', function(id) {
        this.goto('/show', {context: id});
      });
    });

    $statechart.state('show', {isConcurrent: true}, function() {
      this.enter(function(id) {
        $router.path('/campaigns/' + id).search({});
        $state.contentTmpl      = 'show.html';
        $state.selectedCampaign = campaigns[id];
      });

      this.exit(function() { delete $state.selectedCampaign; });

      this.state('filter', function() {
        angular.forEach(['all', 'live', 'issues', 'completed'], function(name) {
          this.state(name, function() {
            this.enter(function() {
              $router.search().filter = $state.selectedCampaignFilter = name;
            });
          });
        }, this);

        this.action('didSelectFilter', function(filter) {
          $router.replace(); this.goto(filter);
        });
      });

      this.state('metric', function() {
        angular.forEach(['conversions', 'pacing', 'delivery'], function(name) {
          this.state(name, function() {
            this.enter(function() {
              $router.search().metric = $state.selectedCampaignMetric = name;
            });
          });
        }, this);

        this.action('didSelectMetric', function(metric) {
          $router.replace(); this.goto(metric);
        });
      });

      this.state('modal', function() {
        this.state('off', function() {
          this.enter(function() {
            delete $router.search().modal;
            $state.showCampaignModal = false;
          });

          this.action('didToggleModal', function() {
            $router.replace(); this.goto('../on');
          });
        });

        this.state('on', function() {
          this.enter(function() {
            $router.search().modal = true;
            $state.showCampaignModal = true;
          });

          this.action('didToggleModal', function() {
            $router.replace(); this.goto('../off');
          });
        });
      });
    });

    $statechart.state('unknownRoute', function() {
      this.enter(function(url) {
        $state.contentTmpl = 'unknown_route.html';
        $state.unknownUrl = url;
      });

      this.exit(function() { delete $state.unknownUrl; });
    });

    $statechart.action('didRouteTo', function(route, params, search) {
      var id, filter, metric, modal;

      switch (route) {
        case 'default':
        case 'campaigns':
          this.goto('/index');
          break;
        case 'campaignShow':
          id     = parseInt(params.id, 10);
          filter = search.filter || 'all';
          metric = search.metric || 'conversions';
          modal  = search.modal ? 'on' : 'off';

          this.goto('/show/filter/' + filter,
                    '/show/metric/' + metric,
                    '/show/modal/' + modal,
                    {context: id, force: true});
          break;
      }
    });

    $statechart.action('didRouteToUnknown', function(url) {
      this.goto('/unknownRoute', {context: url});
    });

    $statechart.goto();
  })

  .run(function($router) { $router.start(); })

  .controller('MainCtrl', function($scope, $state) {
    $scope.state = $state;
  })

  .controller('FooterCtrl', function($scope, $statechart, $router) {
    $scope.current = function() { return $statechart.current().join(', '); };
    $scope.route = $router.route;
    $scope.routeParams = $router.params;
  })

  .controller('IndexCtrl', function($scope) {
    $scope.data = {campaigns: campaigns};
  })

  .controller('ShowCtrl', function($scope, $state) {
    $scope.state  = $state;
    $scope.filter = $state.selectedCampaignFilter;
    $scope.metric = $state.selectedCampaignMetric;
    $scope.modalButtonLabel = function() {
      return $state.showCampaignModal ? 'Close' : 'Open';
    };

    $scope.$watch('state.selectedCampaignFilter', function(v) {
      $scope.filter = v;
    });

    $scope.$watch('state.selectedCampaignMetric', function(v) {
      $scope.metric = v;
    });
  })

  .controller('UnknownRouteCtrl', function($scope, $state) {
    $scope.state = $state;
  });

