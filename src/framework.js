(function(angular, _) {
  angular.module('sis', [
    'ngResource',
    'oc.lazyLoad'
  ]);

  angular.module('sis.api', ['sis']);
  angular.module('sis.modules', ['sis']);

  angular.module('sis.api').value('sisToken', {});

  /**
   * Interceptor for requests that sets the Authorization header
   */
  angular.module('sis.api').factory('authInterceptor', function($q, sisToken, sisApi) {
    return {
      request: function(config) {
        config.headers = config.headers || {};

        // Create a serialized representation of the data (URL encoded)
        // Arrays are not serialized properly so send the raw data
        if (_.has(config, 'data') && _.isObject(config.data) && !_.isArray(config.data)) {
          config.data = $.param(config.data);
        }

        // Set the Authorization header only to calls to the API
        if (sisToken.access_token && config.url.indexOf(sisApi.url) > -1) {
          config.headers.Authorization = 'Bearer ' + sisToken.access_token;
        }

        return config;
      },
      response: function(response) {
        if (response.status === 503) {
          // TODO: Cover errors
        }

        return response || $q.when(response);
      }
    };
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
    $compileProvider, $filterProvider, $ocLazyLoadProvider,
    $logProvider, sisModulesProvider) {

    $logProvider.debugEnabled(false);

    // TODO: Find a better way. Must delay because the sisModulesProvider has to be set
    setTimeout(function() {
      // Allow to load remote directives
      $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        sisModulesProvider.path + '/**'
      ]);
    });

    $ocLazyLoadProvider.config({
      debug: false,
      events: true
    });

    /**
     * Wrapper over AngularJS filters
     * - Allows for a filter to be used by a directive
     * that is created on $compileProvider
     */
    angular.module('sis.modules')._filter = function(name, funct) {
      $filterProvider.register(name, funct);
    };

    /**
     * Wrapper over AngularJS directive
     *  - Allows for directives to be added after Angular is bootstrapped
     *  - Defines a default configuration object which can be extended by the
     *    module
     */
    angular.module('sis.modules')._directive = function(name, conf) {
      $compileProvider.directive(name, ['$injector', '$ocLazyLoad',
        function($injector, $ocLazyLoad) {
          var configuration = conf($injector, $ocLazyLoad),
            default_configuration = {
              restrict: 'E',
              templateUrl: function(element, attrs) {
                var tag = angular.element(element).prop('tagName').toLowerCase();

                return sisModulesProvider.path + '/dist/' + tag + '/' + attrs.version + '/' + tag + '.min.html';
              },
              scope: {
                id: '@id',
                version: '@version'
              }
            };

          return _.extend(default_configuration, configuration);
        }
      ]);
    };
  });
})(window.angular, window._);
