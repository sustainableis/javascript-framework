(function(angular) {
  /**
   * Resource for retrieving Inbounds
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/inbounds
   *  - /v1/inbounds/1
   *  - /v1/inbounds/1/detail
   */
  angular.module('sis.api').factory('InboundService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/inbounds/:id/:controller', {
      id: '@id',
      controller: '@controller'
    }, {});
  }]);
})(window.angular);