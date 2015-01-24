'use strict';

(function(angular) {
    /**
     * Resource for retrieving Weather
     *
     * @param {number|string} id
     * @param {string} controller
     * @param {string} verb
     *
     * Endpoints example:
     *  - /v1/weather
     *  - /v1/weather/accounts
     *  - /v1/weather/accounts/1
     *  - /v1/weather/locations/1/types
     */
    angular.module('sis.api').factory('WeatherService', [
        '$resource',
        'url',
        'version',
        function($resource, url, version) {
            return $resource(url + version + '/weather/:controller/:id/:verb', {
                id: '@id',
                controller: '@controller',
                verb: '@verb'
            });
        }
    ]);
})(window.angular);
