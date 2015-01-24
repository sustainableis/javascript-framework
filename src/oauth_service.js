'use strict';

(function(angular) {
    /**
     * Resource for authorization using Oauth2
     *
     * @param {string} controller
     *
     * Endpoints example:
     *  - /oauth/token
     */
    angular.module('sis.api').factory('OauthService', [
        '$resource',
        'url',
        function($resource, url) {
            return $resource(url + 'oauth/:controller', {
                controller: '@controller'
            });
        }
    ]);
})(window.angular);