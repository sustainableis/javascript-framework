(function(angular) {
  /**
   * Resource for retrieving Fields
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {number|string} metric_name
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/fields
   *  - /v1/fields/1/metrics
   *  - /v1/fields/1/metrics/:metric_name/data
   */
  angular.module('sis.api').factory('FieldsService', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/fields/:id/:controller/:metric_name/:verb', {
      id: '@id',
      controller: '@controller',
      metric_name: '@metric_name',
      verb: '@verb'
    }, {
      'update': {
        method: 'PUT'
      }
    });
  });
})(window.angular);
