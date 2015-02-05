(function(angular) {
  /**
   * Resource for retrieving Files
   *
   * @param {number|string} id
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/files
   *  - /v1/files/1
   *  - /v1/files/1/read
   */
  angular.module('sis.api').factory('FilesService', function($resource,
    url, version) {
    return $resource(url + version + '/files/:id/:verb', {
      id: '@id',
      verb: '@verb'
    });
  });
})(window.angular);