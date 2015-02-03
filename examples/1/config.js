'use strict';

angular.module('sisdemo').config([
    '$routeProvider',
    '$locationProvider',
    'sisConfigurationProvider',
    function($routeProvider, $locationProvider, sisConfigurationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'main.html',
                controller: 'MainController'
            })
            .otherwise({
                redirectTo: '/'
            });

        $locationProvider.hashPrefix('!');
        $locationProvider.html5Mode(false);

        sisConfigurationProvider.token = '6c6eaed5f5361173c408c9dbdf49b3aa9221f846';
        sisConfigurationProvider.debug = true;
    }
]);
