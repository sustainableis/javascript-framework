(function(angular) {
  /**
   * Resource for retrieving Customers
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/customers
   *  - /v1/customers/1
   */
  angular.module('sis.api').factory('CustomersService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/customers/:id/:controller', {
      id: '@id',
      controller: '@controller'
    }, {});
  }]);
})(window.angular);