(function(angular) {
  /**
   * Resource for retrieving Buildings
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/buildings
   *  - /v1/buildings/1
   *  - /v1/buildings/1/outputs
   *  - /v1/buildings/1/outputs?category=demand_usage
   *  - /v1/buildings?facility_id=1
   *  - /v1/buildings/1/mapping/areas
   *  - /v1/buildings/1/outputs/mapping/geometry
   */
  angular.module('sis.api').factory('BuildingsService', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/buildings/:id/:controller/:verb/:action', {
      id: '@id',
      controller: '@controller',
      verb: '@verb',
      action: '@action'
    }, {
      'update': {
        method: 'PUT'
      }
    });
  });
})(window.angular);
