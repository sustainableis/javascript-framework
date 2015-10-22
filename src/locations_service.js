(function(angular) {
  /**
   * Resource for retrieving Locations
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/locations
   *  - /v1/locations/1
   */
  angular.module('sis.api').factory('LocationsService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/locations/:id/:controller', {
      id: '@id',
      controller: '@controller'
    }, {});
  }]);
})(window.angular);