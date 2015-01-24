'use strict';

(function(angular) {
    /**
     * Resource for retrieving Feeds
     *
     * @param {number|string} id
     * @param {string} controller
     * @param {string} verb
     *
     * Endpoints example:
     *  - /v1/feeds
     *  - /v1/feeds/1
     *  - /v1/feeds/1/outputs
     *  - /v1/feeds/1/outputs?category=demand_usage
     *  - /v1/feeds?facility_id=1
     *  - /v1/feeds/types
     */
    angular.module('sis.api').factory('FeedsService', function($resource,
        url, version) {
        return $resource(url + version + '/feeds/:id/:controller/:verb', {
            id: '@id',
            controller: '@controller',
            verb: '@verb'
        });
    });
})(window.angular);
