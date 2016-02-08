(function(angular) {
  /**
   * Resource for retrieving Reports
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/reports/types
   */
  angular.module('sis.api').factory('ReportsService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/reporting/:id/:controller/:verb/:action', {
      id: '@id',
      controller: '@controller',
      verb: '@verb',
      action: '@action'
    }, {
      'update': {
        method: 'PUT'
      },
      'trigger': {
        method: 'POST',
        isArray: true
      }
    });
  }]);
})(window.angular);
