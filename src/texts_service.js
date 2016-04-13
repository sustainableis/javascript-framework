(function(angular) {
  /**
   * Resource for retrieving Texts
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/emails/subscriptions
   *  - /v1/emails/subscriptions/:subscription_id
   *  - /v1/emails/subscriptions/:subscription_id/subscribers/:user_id
   *  - /v1/emails/subscriptions/:subscription_id/trigger
   */
  angular.module('sis.api').factory('TextsService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/texts/:id/:controller/:verb/:action', {
      id: '@id',
      controller: '@controller',
      verb: '@verb',
      action: '@action'
    }, {
      'update': {
        method: 'PUT'
      },
      'trigger': {
        method: 'POST',
        isArray: true
      }
    });
  }]);
})(window.angular);
