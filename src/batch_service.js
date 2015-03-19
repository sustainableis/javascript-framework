(function(angular) {
  /**
   * Resource for makeing Batch requests
   *
   * Endpoints example:
   *  - /v1/batch
   */
  angular.module('sis.api').factory('BatchService', function($resource,
    url, version) {
    return $resource(url + version + '/batch', {}, {
      'update': {
        method: 'PUT'
      }
    });
  });
})(window.angular);
