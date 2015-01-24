'use strict';

(function(angular) {
    /**
     * Resource for retrieving Outputs
     *
     * @param {number|string} id
     * @param {string} controller
     * @param {string} verb
     *
     * Endpoints example:
     *  - /v1/outputs
     *  - /v1/outputs/1
     *  - /v1/outputs/1/fields
     *  - /v1/outputs?facility_id=1
     *  - /v1/outputs/types
     */
    angular.module('sis.api').factory('OutputsService', function($resource,
        url, version) {
        return $resource(url + version + '/outputs/:id/:controller/:verb', {
            id: '@id',
            controller: '@controller',
            verb: '@verb'
        });
    });
})(window.angular);
