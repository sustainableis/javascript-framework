'use strict';

(function(angular) {
    /**
     * Resource for retrieving Buildings
     *
     * @param {number|string} id
     * @param {string} controller
     * @param {string} verb
     *
     * Endpoints example:
     *  - /v1/buildings
     *  - /v1/buildings/1
     *  - /v1/buildings/1/outputs
     *  - /v1/buildings/1/outputs?category=demand_usage
     *  - /v1/buildings?facility_id=1
     */
    angular.module('sis.api').factory('BuildingsService', ['$resource', 'url', 'version', function($resource,
        url, version) {
        return $resource(url + version + '/buildings/:id/:controller/:verb', {
            id: '@id',
            controller: '@controller',
            verb: '@verb'
        });
    }]);
})(window.angular);

'use strict';

(function(angular, _) {
    /**
     * Provider for managing API calls
     */
    angular.module('sis.modules').provider('dataStore', function() {
        this.cache = {};

        this.$get = ['$injector', '$log', 'OauthService', 'FacilitiesService', 'OrganizationsService', 'BuildingssService', 'FeedsService', 'OutputsService', 'UsersService', 'WeatherService', function($injector, $log, OauthService, FacilitiesService,
            OrganizationsService, BuildingssService, FeedsService, OutputsService,
            UsersService, WeatherService) {
            var _this = this;

            /**
             * Decode topic to object which can be passed to the service.
             * Note: Filters are not differentiated because there is not need
             * to. The AngularJS Resource knows to add the filter properly
             * based on its declaration.
             *
             * @param {string} topic
             *
             * Topics example:
             *  - service:modules/id:1/controller:configuration
             *  - service:facilities/id:1/controller:feeds/type:egauge
             */
            var _decode_topic = function(topic) {
                var decoded = {},
                    components = topic.split('/');

                _.each(components, function(component) {
                    var _components = component.split(':'),
                        key = _components[0],
                        value = _components[1];

                    decoded[key] = value;
                });

                return decoded;
            }

            /**
             * Call a service based on the encoded topic. It's safe to
             * assume the service name to be the service component of the topic
             * concatenated with 'Service'.
             *
             * @param {string} topic
             * @param {function} callback
             */
            var _call = function(topic, callback) {
                var topic = _decode_topic(topic),
                    service_name = topic.service.charAt(0).toUpperCase() +
                                    topic.service.slice(1) + 'Service',
                    service = $injector.get(service_name),
                    call_params = _.omit(topic, 'service');

                // TODO: Call query or get depending on the response (array or not)
                // TODO: Handle failed responses
                service.query(call_params, function(data) {
                    callback(data);
                });
            }

           /**
             * Get data for a topic from cache or the API
             *
             * @param {string} topic
             * @param {function} callback
             */
            var _get = function(topic, callback) {
                if (_.has(_this.cache, topic)) {
                    $log.debug('Returned', _this.cache[topic], 'from cache', 'for topic', topic);

                    return callback(_this.cache[topic]);
                }

                _call(topic, function(data) {
                    $log.debug('Returned', data, 'from API', 'for topic', topic);

                    _this.cache[topic] = data;

                    callback(data);
                });
            }

            return {
                get: _get
            }
        }]
    });
})(window.angular, window._);

'use strict';

(function() {
    var topics = {};

    var _subscribe = function(topic, listener) {
        if (!topics[topic]) {
            topics[topic] = {
                queue: []
            }
        }
        
        topics[topic].queue.push(listener);
    }

    var _unsubscribe = function(index) {
        delete topics[topic].queue[index];
    }

    var _publish = function(topic, message) {
        var message = message || {};

        if (!topics[topic] || !topics[topic].queue.length) {
            return;
        }

        topics[topic].queue.forEach(function(listener) {
            listener(message);
        });
    }

    window.events = {
        subscribe: _subscribe,
        unsubscribe: _unsubscribe,
        publish: _publish,
        topics: topics
    };
})();

'use strict';

(function(angular) {
    /**
     * Resource for retrieving Facilties
     *
     * @param {number|string} id
     * @param {string} controller
     * @param {string} verb
     * @param {string} action
     *
     * Endpoints example:
     *  - /v1/facilities
     *  - /v1/facilities/1
     *  - /v1/facilities/1/outputs
     *  - /v1/facilities?organization_id=1
     *  - /v1/facilities/outputs/types
     *  - /v1/facilities/1/outputs/tree/validate
     *  - /v1/facilities/1/wms/products
     */
    angular.module('sis.api').factory('FacilitiesService', ['$resource', 'url', 'version', function($resource,
        url, version) {
        return $resource(url + version + '/facilities/:id/:controller/:verb/:action', {
            id: '@id',
            controller: '@controller',
            verb: '@verb',
            action: '@action'
        });
    }]);
})(window.angular);

'use strict';

(function(angular) {
    /**
     * Resource for retrieving Feeds
     *
     * @param {number|string} id
     * @param {string} controller
     * @param {string} verb
     *
     * Endpoints example:
     *  - /v1/feeds
     *  - /v1/feeds/1
     *  - /v1/feeds/1/outputs
     *  - /v1/feeds/1/outputs?category=demand_usage
     *  - /v1/feeds?facility_id=1
     *  - /v1/feeds/types
     */
    angular.module('sis.api').factory('FeedsService', ['$resource', 'url', 'version', function($resource,
        url, version) {
        return $resource(url + version + '/feeds/:id/:controller/:verb', {
            id: '@id',
            controller: '@controller',
            verb: '@verb'
        });
    }]);
})(window.angular);

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
    angular.module('sis.api').factory('authInterceptor', ['$q', 'sisConfiguration', function($q,
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
    }]);

    /**
     * Configuration for the sis.api module
     */
    angular.module('sis.api').config(['$httpProvider', '$logProvider', 'sisConfigurationProvider', function($httpProvider, $logProvider,
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
    }]);

    /**
     * Configuration for the sis.modules module
     */
    angular.module('sis.modules').config(['$sceDelegateProvider', 'path', function($sceDelegateProvider, path) {
        // Allow to load remote directives
        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            path
        ]);
    }]);
})(window.angular);

'use strict';

(function(angular, events, _, $) {
    /**
     * Provider for orchestrating the modules inserted on the page
     */
    angular.module('sis.modules').provider('sisModules', function() {
        this.modules = [];

        this.$get = ['$injector', '$q', '$log', 'dataStore', 'ModulesService', function($injector, $q, $log, dataStore, ModulesService) {
            var _this = this;

            /**
             * Builds an internal list with modules embedded on the page
             */
            var _discover = function() {
                // TODO: Inject jQuery or use something else for DOM selection
                var modules = $('.module');

                _.each(modules, function(module) {
                    var id = angular.element(module).data('id');

                    _this.modules.push({id: id});
                });
            }

            /**
             * Initialize the modules
             */
            var _init = function(callback) {
                var calls = [];

                // Get the channels for each module and send them to the module
                _.each(_this.modules, function(module) {
                    var call = ModulesService.query({
                            id: module.id,
                            controller: 'channels'
                        }, function(data) {
                            module['channels'] = data;

                            $log.debug('Framework sent', data, 'on', module.id + ':channels');

                            events.publish(module.id + ':channels', data);
                        });

                    calls.push(call);
                });

                // When all the channels are retrieved get data from them
                $q.all(calls).then(function() {
                    callback();

                    events.subscribe('new', function(data) {
                        $log.debug('Framework got', data, 'on', 'new');

                        dataStore.get(data.channel, function(_data) {
                            $log.debug('Framework sent', _data, 'on', data.caller);

                            events.publish(data.caller, _data);
                        });
                    });

                    events.subscribe('refresh', function(data) {
                        $log.debug('Framework got', data, 'on', 'new');
                    });

                    _.each(_this.modules, function(module) {
                        // Send data to the module for each channel
                        // TODO: Probably it's best to get data as soon as the channels are retrieved for each module
                        _.each(module.channels, function(channel) {
                            // Subscribe to all channels in the framework as well to enable two-way communication
                            events.subscribe(channel.topic, function(data) {
                                $log.debug('Framework got', data, 'on', channel.topic);
                            });

                            dataStore.get(channel.topic, function(data) {
                                $log.debug('Framework sent', data, 'on', module.id + ':' + channel.route);

                                events.publish(module.id + ':' + channel.route, data);
                            });

                        });
                    });
                });
            }

            return {
                discover: _discover,
                init: _init
            }
        }]
    });
})(window.angular, window.events, window._, window.$);

'use strict';

(function(angular) {
    /**
     * ModulesService mockup. It's temporary. It will be replaced with a proper
     * resource when the API implementation for the endpoints is ready.
     */
    angular.module('sis.api').factory('ModulesService', ['$resource', function($resource) {
        var modules = [
            {
                id: 1,
                tag: 'table-module-angular'
            },
            {
                id: 2,
                tag: 'table-module-angular'
            },
            {
                id: 3,
                tag: 'dropdown-module-angular'
            },
            {
                id: 4,
                tag: 'table-module'
            }
        ];

        var configurations = [
            {
                id: 1,
                module_id: 1,
                refresh: 10,
                stale: 60,
                name: 'Feeds for Facility',
                headers: JSON.stringify(['Id', 'Created At', 'description', 'Key'])
            },
            {
                id: 2,
                module_id: 2,
                refresh: 10,
                stale: 60,
                name: 'Outputs for Facility',
                headers: JSON.stringify(['Id', 'Created At', 'description', 'Key'])
            },
            {
                id: 3,
                module_id: 3,
                refresh: 10,
                stale: 60,
                name: 'Select Facility'
            },
            {
                id: 4,
                module_id: 4,
                refresh: 10,
                stale: 60,
                name: 'Polymer table module',
                headers: JSON.stringify(['Id', 'Created At', 'description', 'Key'])

            }
        ];

        var channels = [
            {
                id: 1,
                module_id: 1,
                route: 'data',
                topic: 'service:facilities/id:1/controller:feeds'
            },
            {
                id: 2,
                module_id: 1,
                route: 'configuration',
                topic: 'service:modules/id:1/controller:configuration'
            },
            {
                id: 3,
                module_id: 2,
                route: 'data',
                topic: 'service:facilities/id:1/controller:outputs'
            },
            {
                id: 4,
                module_id: 2,
                route: 'configuration',
                topic: 'service:modules/id:2/controller:configuration'
            },
            {
                id: 5,
                module_id: 3,
                route: 'data',
                topic: 'service:facilities'
            },
            {
                id: 6,
                module_id: 3,
                route: 'configuration',
                topic: 'service:modules/id:3/controller:configuration'
            },
            {
                id: 7,
                module_id: 4,
                route: 'data',
                topic: 'service:facilities/id:1/controller:feeds'
            },
            {
                id: 8,
                module_id: 4,
                route: 'configuration',
                topic: 'service:modules/id:1/controller:configuration'
            }
        ];

        return {
            // /modules/:id:/controller
            query: function(options, callback) {
                var results;

                switch(options.controller) {
                    case 'configuration':
                        results = _.findWhere(configurations, {
                            module_id: parseInt(options.id)
                        });
                    break;

                    case 'channels':
                        results = _.where(channels, {
                            module_id: options.id
                        });
                    break;

                    default:
                        results = _.findWhere(modules, {
                            id: options.id
                        });
                    break;
                }

                callback(results);
            }
        }
    }]);
})(window.angular);

'use strict';

(function(angular) {
    /**
     * Resource for authorization using Oauth2
     *
     * @param {string} controller
     *
     * Endpoints example:
     *  - /oauth/token
     */
    angular.module('sis.api').factory('OauthService', ['$resource', 'url', function($resource, url) {
        return $resource(url + 'oauth/:controller', {
            controller: '@controller'
        });
    }]);
})(window.angular);

'use strict';

(function(angular) {
    /**
     * Resource for retrieving Organizations
     *
     * @param {number|string} id
     * @param {string} controller
     * @param {string} verb
     *
     * Endpoints example:
     *  - /v1/organizations
     *  - /v1/organizations/1
     *  - /v1/organizations/1/facilities
     *  - /v1/organizations/1/facilities/tree?start_node_id=1
     */
    angular.module('sis.api').factory('OrganizationsService', ['$resource', 'url', 'version', function($resource,
        url, version) {
        return $resource(url + version + '/organizations/:id/:controller/:verb', {
            id: '@id',
            controller: '@controller',
            verb: '@verb'
        });
    }]);
})(window.angular);

'use strict';

(function(angular) {
    /**
     * Resource for retrieving Outputs
     *
     * @param {number|string} id
     * @param {string} controller
     * @param {string} verb
     *
     * Endpoints example:
     *  - /v1/outputs
     *  - /v1/outputs/1
     *  - /v1/outputs/1/fields
     *  - /v1/outputs?facility_id=1
     *  - /v1/outputs/types
     */
    angular.module('sis.api').factory('OutputsService', ['$resource', 'url', 'version', function($resource,
        url, version) {
        return $resource(url + version + '/outputs/:id/:controller/:verb', {
            id: '@id',
            controller: '@controller',
            verb: '@verb'
        });
    }]);
})(window.angular);

'use strict';

(function(angular) {
    /**
     * Resource for retrieving Users
     *
     * @param {number|string} id
     * @param {string} controller
     * @param {string} verb
     *
     * Endpoints example:
     *  - /v1/users
     *  - /v1/users/1
     *  - /v1/users/1/access
     *  - /v1/users?facility_id=1
     */
    angular.module('sis.api').factory('UsersService', ['$resource', 'url', 'version', function($resource,
        url, version) {
        return $resource(url + version + '/users/:id/:controller/:verb', {
            id: '@id',
            controller: '@controller',
            verb: '@verb'
        });
    }]);
})(window.angular);

'use strict';

(function(angular) {
    /**
     * Resource for retrieving Weather
     *
     * @param {number|string} id
     * @param {string} controller
     * @param {string} verb
     *
     * Endpoints example:
     *  - /v1/weather
     *  - /v1/weather/accounts
     *  - /v1/weather/accounts/1
     *  - /v1/weather/locations/1/types
     */
    angular.module('sis.api').factory('WeatherService', ['$resource', 'url', 'version', function($resource,
        url, version) {
        return $resource(url + version + '/weather/:controller/:id/:verb', {
            id: '@id',
            controller: '@controller',
            verb: '@verb'
        });
    }]);
})(window.angular);
