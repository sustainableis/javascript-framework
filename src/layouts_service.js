(function(angular) {
  /**
   * Resource for retrieving Layouts
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/layouts
   *  - /v1/layouts/1
   */
  angular.module('sis.api').factory('LayoutsService', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/layouts/:id/:controller/:verb', {
      id: '@id',
      controller: '@controller',
      verb: '@verb'
    }, {
      'update': {
        method: 'PUT'
      }
    });
  });
})(window.angular);
