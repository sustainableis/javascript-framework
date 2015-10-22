(function(angular) {
  /**
   * Resource for retrieving Lots
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/locations
   *  - /v1/locations/1
   */
  angular.module('sis.api').factory('LotsService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/lots/:id/:controller', {
      id: '@id',
      controller: '@controller'
    }, {});
  }]);
})(window.angular);