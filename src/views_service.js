(function(angular) {
  /**
   * Resource for retrieving Views
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/views
   *  - /v1/views/1
   *  - /v1/views/1/modules
   *  - /v1/views?organization_id=1
   */
  angular.module('sis.api').factory('ViewsService', function($resource, url,
    version) {
    return $resource(url + version + '/views/:id/:controller/:verb/:action', {
      id: '@id',
      controller: '@controller',
      verb: '@verb',
      action: '@action'
    });
  });
})(window.angular);