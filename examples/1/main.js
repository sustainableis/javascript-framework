'use strict'

angular.module('sisdemo').controller('MainController', [
    '$scope',
    'sisModules',
    function($scope, sisModules) {
        sisModules.discover();

        // Must delay until the modules are loaded and ready to receive events.
        // A default delay is added as the modules wait for data from the API.
        // TODO: Allow each module to send an event once it's ready to be used
        setTimeout(function() {
            sisModules.init(function() {
                console.log('Modules initialized');
            });
        }, 100);
    }
]);
