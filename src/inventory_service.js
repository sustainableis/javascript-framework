(function(angular) {
  /**
   * Resource for retrieving Inventory
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/inventory
   *  - /v1/locations/1
   */
  angular.module('sis.api').factory('InventoryService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/inventory', {}, {});
  }]);
})(window.angular);