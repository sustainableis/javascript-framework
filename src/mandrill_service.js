(function(angular) {
  /**
   * Resource for retrieving Madrill
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/mandrill/templates
   *  - /v1/mandrill/templates/:mandrill_email_template_id
   *  - /v1/mandrill/templates/:mandrill_email_template_id/variables
   */
  angular.module('sis.api').factory('MandrillService', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/mandrill/:id/:controller/:verb/:action', {
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
