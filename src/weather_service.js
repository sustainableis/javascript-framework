(function(angular) {
  /**
   * Resource for retrieving Weather
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/weather
   *  - /v1/weather/accounts
   *  - /v1/weather/accounts/1
   *  - /v1/weather/locations/1/types
   *  - /v1/weather/locations/1/forecast/hourly
   */
  angular.module('sis.api').factory('WeatherService', function($resource,
    url, version) {
    return $resource(url + version + '/weather/:controller/:id/:verb/:action', {
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
