(function(angular) {
  /**
   * Resource for authorization using Oauth2
   *
   * @param {string} controller
   *
   * Endpoints example:
   *  - /oauth/token
   */
  angular.module('sis.api').factory('OauthService', function($resource, sisApi) {
    return $resource(sisApi.url + 'oauth/:controller', {
      controller: '@controller'
    });
  });
})(window.angular);
