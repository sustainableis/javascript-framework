(function(angular) {
  /**
   * Resource for retrieving Groups
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/groups
   */
  angular.module('sis.api').factory('GroupsService', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/groups/:id/:controller/:verb', {
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
