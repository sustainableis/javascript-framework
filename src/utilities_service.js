(function(angular) {
  /**
   * Resource for retrieving Utilities
   *
   * @param {string} controller
   * @param {number|string} id
   * @param {string} verb
   * @param {string} verb_id
   *
   * Endpoints example:
   *  - /v1/utilities/accounts
   *  - /v1/utilities/statements/2/tree
   *  - /v1/utilities/statements/2/tree/63
   */
  angular.module('sis.api').factory('UtilitiesService', function($resource,
    url, version) {
    return $resource(url + version + '/utilities/:controller/:id/:verb/:verb_id', {
      controller: '@controller',
      id: '@id',
      verb: '@verb',
      verb_id: '@verb_id'
    }, {
      'update': {
        method: 'PUT'
      }
    });
  });
})(window.angular);