'use strict'

angular.module('sisdemo')
  .controller('MainController', function($scope, sisModules, sisToken) {
    sisToken.access_token = 'c6332e5cf99a43855d84fa509b79b914c1d56153';

    sisModules.init(function() {
      console.log('Modules initialized');
    });

    $scope.$on('$destroy', function() {
      sisModules.destroy();
    });
  });
