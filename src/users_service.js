'use strict';

(function(angular) {
    /**
     * Resource for retrieving Users
     *
     * @param {number|string} id
     * @param {string} controller
     * @param {string} verb
     *
     * Endpoints example:
     *  - /v1/users
     *  - /v1/users/1
     *  - /v1/users/1/access
     *  - /v1/users?facility_id=1
     */
    angular.module('sis.api').factory('UsersService', function($resource,
        url, version) {
        return $resource(url + version + '/users/:id/:controller/:verb', {
            id: '@id',
            controller: '@controller',
            verb: '@verb'
        });
    });
})(window.angular);
