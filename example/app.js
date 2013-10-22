window.campaigns = [
  {id: 0, name: 'Campaign 0'},
  {id: 1, name: 'Campaign 1'},
  {id: 2, name: 'Campaign 2'},
  {id: 3, name: 'Campaign 3'},
  {id: 4, name: 'Campaign 4'}
];

angular.module('app', ['state'])
  .run(function($rootScope, $statechart, $state) {
    $statechart.trace = true;

    $statechart.unknown(function(path) {
      if (path === '' || path === '/') { $statechart.goto('/index'); }
      else { $statechart.goto('/unknownRoute', {context: path}); }
    });

    $statechart.state('start');

    $statechart.state('index', function() {
      this.route('/campaigns');

      this.enter(function() {
        $state.contentTmpl = 'index.html';
      });

      this.action('didSelectCampaign', function(id) {
        this.goto('/show', {context: id});
      });
    });

    $statechart.state('show', {isConcurrent: true}, function() {
      this.route('/campaigns/:id');

      this.enter(function(ctx) {
        $state.contentTmpl      = 'show.html';
        $state.selectedCampaign = campaigns[ctx.id];
      });

      this.exit(function() { delete $state.selectedCampaign; });

      this.state('filter', function() {
        this.C(function(ctx) {
          return ctx && ctx.filter ? ctx.filter : 'all';
        });

        angular.forEach(['all', 'live', 'issues', 'completed'], function(name) {
          this.state(name, function() {
            this.enter(function() {
              this.search({filter: name});
              $state.selectedCampaignFilter = name;
            });
          });
        }, this);

        this.action('didSelectFilter', function(filter) {
          this.replace(); this.goto(filter);
        });
      });

      this.state('metric', function() {
        this.C(function(ctx) {
          return ctx && ctx.metric ? ctx.metric : 'pacing';
        });

        angular.forEach(['conversions', 'pacing', 'delivery'], function(name) {
          this.state(name, function() {
            this.enter(function() {
              this.search({metric: name});
              $state.selectedCampaignMetric = name;
            });
          });
        }, this);

        this.action('didSelectMetric', function(metric) {
          this.replace(); this.goto(metric);
        });
      });

      this.state('modal', function() {
        this.C(function(ctx) { return ctx && ctx.modal ? './on' : './off'; });

        this.state('off', function() {
          this.enter(function() {
            this.search({modal: false});
            $state.showCampaignModal = false;
          });

          this.action('didToggleModal', function() {
            this.replace(); this.goto('../on');
          });
        });

        this.state('on', function() {
          this.enter(function() {
            this.search({modal: true});
            $state.showCampaignModal = true;
          });

          this.action('didToggleModal', function() {
            this.replace(); this.goto('../off');
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

    $statechart.goto();
  })

  .run(function($router) { $router.start(); })

  .controller('MainCtrl', function($scope, $state) {
    $scope.state = $state;
  })

  .controller('FooterCtrl', function($scope, $statechart) {
    $scope.current = function() { return $statechart.current().join(', '); };
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

