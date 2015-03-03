'use strict';

angular.module('sisdemo').config([
    '$routeProvider',
    '$locationProvider',
    'sisConfigurationProvider',
    function($routeProvider, $locationProvider, $logProvider, sisModulesProvider) {
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

        $logProvider.debugEnabled(true);

        sisModulesProvider.path = 'http://d10t57k8pf74ki.cloudfront.net/dist/';
    }
]);
