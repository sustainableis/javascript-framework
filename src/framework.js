'use strict';

(function(angular) {
  angular.module('sis', [
    'ngResource'
  ]);

  angular.module('sis.api', ['sis']);
  angular.module('sis.modules', ['sis']);

  angular.module('sis.api').constant('url', 'http://api.sustainableis.com/');
  angular.module('sis.api').constant('version', 'v1');
  angular.module('sis.api').value('auth', {
    token: null
  });

  /**
   * Interceptor for requests that sets the Authorization header
   */
  angular.module('sis.api').factory('authInterceptor', function($q, auth) {
    return {
      request: function(config) {
        config.headers = config.headers || {};

        if (config.data && typeof config.data === 'object') {
          config.data = $.param(config.data);
        }

        if (auth.token) {
          config.headers.Authorization = 'Bearer ' + auth.token;
        }

        return config;
      },
      response: function(response) {
        if (response.status === 503) {
          // TODO: Cover errors
        }

        return response || $q.when(response);
      }
    }
  });

  /**
   * Configuration for the sis.api module
   */
  angular.module('sis.api').config(function($httpProvider) {
    $httpProvider.defaults.headers.post['Content-Type'] =
      'application/x-www-form-urlencoded; charset=UTF-8;';
    $httpProvider.defaults.headers.put['Content-Type'] =
      'application/x-www-form-urlencoded; charset=UTF-8;';

    // $httpProvider.defaults.useXDomain = true;
    // delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $httpProvider.interceptors.push('authInterceptor');
  });

  /**
   * Configuration for the sis.modules module
   */
  angular.module('sis.modules').config(function($sceDelegateProvider,
    $compileProvider, sisModulesProvider) {

    // TODO: Find a better way. Must delay because the sisModulesProvider has to be set
    setTimeout(function() {
      // Allow to load remote directives
      $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        sisModulesProvider.path + '**'
      ]);
    });

    // Allow to add directives after bootstraping
    angular.module('sis.modules')._directive = $compileProvider.directive;
  });
})(window.angular);