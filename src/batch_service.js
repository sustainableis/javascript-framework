(function(angular) {
  /**
   * Resource for makeing Batch requests
   *
   * Endpoints example:
   *  - /v1/batch
   */
  angular.module('sis.api').factory('BatchService', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/batch', {}, {
      'update': {
        method: 'PUT'
      }
    });
  });
})(window.angular);
