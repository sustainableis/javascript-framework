(function(angular) {
  /**
   * Resource for retrieving Rates
   *
   * @param {string} controller
   * @param {number|string} id
   * @param {string} verb
   * @param {number|string} second_id
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/rates/schedules
   *  - /v1/rates/schedules/1
   *  - /v1/rates/schedules/1/periods
   *  - /v1/rates/schedules/1/periods/current
   *  - /v1/rates/seasons/1/periods/1/rates
   */
  angular.module('sis.api').factory('RatesService', function($resource,
    url, version) {
    return $resource(url + version + '/rates/:controller/:id/:verb/:second_id/:action', {
      controller: '@controller',
      id: '@id',
      verb: '@verb',
      second_id: '@second_id',
      action: '@action'
    }, {
      'update': {
        method: 'PUT'
      }
    });
  });
})(window.angular);
