(function(angular) {
  /**
   * Resource for retrieving Alerts
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/alerts/types
   */
  angular.module('sis.api').factory('AlertsService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/alerts/:id/:controller/:verb/:action', {
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
