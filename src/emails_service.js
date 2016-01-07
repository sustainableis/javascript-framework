(function(angular) {
  /**
   * Resource for retrieving Emails
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {number|string} verb_id
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/emails/subscriptions
   *  - /v1/emails/subscriptions/:subscription_id
   *  - /v1/emails/subscriptions/:subscription_id/subscribers/:user_id
   *  - /v1/emails/subscriptions/:subscription_id/trigger
   */
  angular.module('sis.api').factory('ViewsService', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/views/:id/:controller/:verb/:action', {
      id: '@id',
      controller: '@controller',
      verb: '@verb',
      verb_id: '@verb_id',
      action: '@action'
    }, {
      'update': {
        method: 'PUT'
      }
    });
  });
})(window.angular);
