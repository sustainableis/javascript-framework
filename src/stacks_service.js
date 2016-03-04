(function(angular) {
  /**
   * Resource for retrieving Stacks
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/stacks
   *  - /v1/stacks/1
   *  - /v1/stacks/1/endpoints
   */
  angular.module('sis.api').factory('StacksService', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/stacks/:id/:controller/:verb', {
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
