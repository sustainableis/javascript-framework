(function(angular) {
  /**
   * Resource for retrieving Configurations
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/configurations
   *  - /v1/configurations/1
   *  - /v1/configurations/1/values
   */
  angular.module('sis.api').factory('ConfigurationsService', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/configurations/:id/:controller/:verb/:action', {
      id: '@id',
      controller: '@controller',
      verb: '@verb',
      action: '@action'
    }, {
      'update': {
        method: 'PUT'
      }
    });
  });
})(window.angular);
