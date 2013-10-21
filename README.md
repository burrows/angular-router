# AngularJS Router with Statechart Integration

The `$router` object is a wrapper around angular's `$location` service that integrates with a statechart. It works by observing changes to the `$location.path()` and `$location.search()` values and triggers a `didRouteTo` action on the `$statechart` based on the matching route. Routes are defined with a name and pattern. The name of the matching route is passed along with the `didRouteTo` action with the current values of `$location.path()` and `$location.search()`.

The `didRouteTo` action handler should be defined on the root of your statechart. It is responsible for mapping the matching route and search params to a particular state or set of states. It should then trigger a transition to the new state(s) using the `goto` method.

When you want to update the current URL upon entering a new state, the `$router.path()` and `$router.search()` methods can be used to set the current path and search params.

State concurrency can be managed with the search params. The `didRouteTo` action handler can use them to map to an array of states and the `enter` method of each concurrent state can update a corresponding search param.

If the user changes the browser's URL to something that doesn't match any of the defined routes, then the `didRouteToUnknown` action is sent to the statechart along with the current URL.

## Setup

    $ npm install

## Run Specs

    $ npm install -g karma # if not already installed
    $ karma start

## Example App

An example app is available in `example/index.html`.
