(function(angular) {
  /**
   * Resource for retrieving Areas
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/areas
   *  - /v1/areas/1
   *  - /v1/areas/1/outputs
   *  - /v1/areas/1/outputs?type=temperature
   */
  angular.module('sis.api').factory('AreasService', function($resource,
    url, version) {
    return $resource(url + version + '/areas/:id/:controller/:verb/:action', {
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
