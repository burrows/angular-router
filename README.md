# AngularJS Statechart with Routing

This project contains two angular services: `$router` and `$statechart`.

The `$router` service is a dead simple router object that is built on top of the `$location` service. It allows you define routes as patterns with a callback that is invoked when a URL change matches the pattern. You can also set the current route and params on the `$router` to cause it to update the browser's URL.

The `$statechart` service is a wrapper around the [statechart.js](https://github.com/burrows/statechart.js) project. It allows you to easily define a statechart to manage the state of your angular application. Additionally, it enhances the `State` objects to give them a hook into the `$router` service. You can define routes directly on your states using the `route` method and the internal wiring is hooked up for you automatically. When states with a defined route are entered, the URL is automatically updated and when URL changes are detected, a transition to the state with the matching route is automatically triggered.

One particular feature worth mentioning is that the approach to routing used here works nicely with concurrent states. You would typically define a route at the state containing concurrent states. The concurrent states can either be tracked by separate params in the route pattern or by using the `$location.search()` params. When each concurrent state is entered, it should update either `$router.params()` or `$router.search()` to record itself. Then, when the next `$digest` cycle is run, the current URL to use is generated based off of the currently set route, params and search objects. See `example/app.js` to see an example of how this is done.

## Setup

    $ npm install

## Run Specs

    $ npm install -g karma # if not already installed
    $ karma start

## Example App

An example app is available in `example/index.html`.
