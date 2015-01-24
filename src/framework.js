'use strict';

(function(angular) {
    angular.module('sis', [
        'ngResource',
        'sis.api',
        'sis.modules'
    ]);

    angular.module('sis.api', []);
    angular.module('sis.modules', []);

    angular.module('sis.api').constant('url', 'http://api.sustainableis.com/');
    angular.module('sis.api').constant('version', 'v1');
    angular.module('sis.modules').constant('path', 'http://d10t57k8pf74ki.cloudfront.net/**');

    /**
     * Provider for configuration of the sis.api module
     */
    angular.module('sis.api').provider('sisConfiguration', function() {
        this.token = null;
        this.debug = false;

        this.$get = [
            '$injector',
            function($injector) {
                return {
                    token: this.token,
                    debug: this.debug
                }
            }
        ];
    });

    /**
     * Interceptor for requests that sets the Authorization header
     */
    angular.module('sis.api').factory('authInterceptor', function($q,
        sisConfiguration) {
        return {
            request: function(config) {
                config.headers = config.headers || {};

                if (config.data && typeof config.data === 'object') {
                    config.data = $.param(config.data);
                }

                if (sisConfiguration.token) {
                    config.headers.Authorization = 'Bearer ' + sisConfiguration.token;
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
    angular.module('sis.api').config(function($httpProvider, $logProvider,
        sisConfigurationProvider) {
        $httpProvider.defaults.headers.post['Content-Type'] = 
            'application/x-www-form-urlencoded; charset=UTF-8;';

        // $httpProvider.defaults.useXDomain = true;
        // delete $httpProvider.defaults.headers.common['X-Requested-With'];

        $httpProvider.interceptors.push('authInterceptor');

        // Must delay because the sisConfigurationProvider has to be set
        // TODO: Find a better way
        setTimeout(function() {
            $logProvider.debugEnabled(sisConfigurationProvider.debug || false);
        });
    });

    /**
     * Configuration for the sis.modules module
     */
    angular.module('sis.modules').config(function($sceDelegateProvider, path) {
        // Allow to load remote directives
        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            path
        ]);
    });
})(window.angular);
