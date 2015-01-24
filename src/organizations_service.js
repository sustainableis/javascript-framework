'use strict';

(function(angular) {
    /**
     * Resource for retrieving Organizations
     *
     * @param {number|string} id
     * @param {string} controller
     * @param {string} verb
     *
     * Endpoints example:
     *  - /v1/organizations
     *  - /v1/organizations/1
     *  - /v1/organizations/1/facilities
     *  - /v1/organizations/1/facilities/tree?start_node_id=1
     */
    angular.module('sis.api').factory('OrganizationsService', function($resource,
        url, version) {
        return $resource(url + version + '/organizations/:id/:controller/:verb', {
            id: '@id',
            controller: '@controller',
            verb: '@verb'
        });
    });
})(window.angular);
