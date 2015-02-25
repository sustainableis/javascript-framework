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
  angular.module('sis.modules').constant('path', 'http://d10t57k8pf74ki.cloudfront.net/');

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
    $httpProvider.defaults.headers.put['Content-Type'] =
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
  angular.module('sis.modules').config(['$sceDelegateProvider', '$compileProvider', 'path', function($sceDelegateProvider, $compileProvider, path) {
    // Allow to load remote directives
    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      path + '**'
    ]);

    // Allow to add directives after bootstraping
    angular.module('sis.modules').compileProvider = $compileProvider;
  }]);
})(window.angular);
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
(function(angular, _) {
  /**
   * Provider for managing API calls
   */
  angular.module('sis.modules').provider('dataStore', function() {
    this.cache = {};
    this.GET = 0;
    this.POST = 1;

    this.$get = ['$injector', '$log', 'OauthService', 'FacilitiesService', 'OrganizationsService', 'BuildingsService', 'FeedsService', 'OutputsService', 'UsersService', 'WeatherService', function($injector, $log, OauthService, FacilitiesService,
      OrganizationsService, BuildingsService, FeedsService, OutputsService,
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
       * @param {object} payload
       * @param {function} callback
       */
      var _call = function(method, topic, payload, callback) {
        var topic = _decode_topic(topic),
          service_name = topic.service.charAt(0).toUpperCase() +
          topic.service.slice(1) + 'Service',
          service = $injector.get(service_name),
          call_params = _.omit(topic, 'service');

        // TODO: Handle failed responses
        switch(method) {
          case _this.GET:
            // TODO: Call query or get depending on the response (array or not)
            service.query(call_params,
            function(data) {
              callback(data);
            },
            function(error) {
              callback(null, error);
            });
          break;

          case _this.POST:
            service.save(call_params, payload,
            function(data) {
              callback(data);
            },
            function(error) {
              callback(null, error);
            });
          break;

          default:
            $log.error('Invalid method', method, 'for calling', topic);
        }
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

        _call(_this.GET, topic, null, function(data, error) {
          $log.debug('Returned', data, 'from API', 'for topic', topic);

          _this.cache[topic] = data;

          callback(data, error);
        });
      }

      /**
       * Send data for a topic to the API
       *
       * @param {string} topic
       * @param {object} payload
       * @param {function} callback
       */
      var _post = function(topic, payload, callback) {
        _call(_this.POST, topic, payload, function(data, error) {
          $log.debug('Returned', data, 'from API', 'for topic', topic);

          callback(data, error);
        });
      }

      return {
        get: _get,
        post: _post
      }
    }]
  });
})(window.angular, window._);
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
(function(angular) {
  /**
   * Resource for retrieving Facilities
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
(function(angular) {
  /**
   * Resource for retrieving Files
   *
   * @param {number|string} id
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/files
   *  - /v1/files/1
   *  - /v1/files/1/read
   */
  angular.module('sis.api').factory('FilesService', ['$resource', 'url', 'version', function($resource,
    url, version) {
    return $resource(url + version + '/files/:id/:verb', {
      id: '@id',
      verb: '@verb'
    });
  }]);
})(window.angular);
(function(angular) {
  /**
   * Resource for retrieving Layouts
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/layouts
   *  - /v1/layouts/1
   */
  angular.module('sis.api').factory('LayoutsService', ['$resource', 'url', 'version', function($resource,
    url, version) {
    return $resource(url + version + '/layouts/:id/:controller/:verb', {
      id: '@id',
      controller: '@controller',
      verb: '@verb'
    });
  }]);
})(window.angular);
(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the modules inserted on the page
   */
  angular.module('sis.modules').provider('sisModules', function() {
    this.modules = [];

    this.$get = ['$injector', '$q', '$log', '$rootScope', '$compile', 'dataStore', 'ModulesService', 'path', function($injector, $q, $log, $rootScope, $compile, dataStore, ModulesService, path) {
      var _this = this;

      /**
       * Builds an internal list with modules embedded on the page and loads
       * script files
       */
      var _discover = function() {
        var modules = angular.element('.module');

        _.each(modules, function(module) {
          var id = angular.element(module).data('id'),
              parent = angular.element(module).parent(),
              tag = angular.element(module).prop('tagName').toLowerCase(),
              script = document.createElement('script');

          // Do not initialize a module twice
          if (_.findWhere(_this.modules, {id: id})) {
            return;
          }

          _this.modules.push({
            id: id
          });

          angular.element(module).remove();

          script.src = path + tag + '/' + tag + '.js';
          script.onload = function() {
            var new_module = $compile(module)($rootScope);

            parent.append(new_module);
          }

           document.getElementsByTagName('head')[0].appendChild(script);
        });
      }

      /**
       * Initialize the modules
       */
      var _init = function(callback) {
        var calls = [];

        // Get the channels for each module and send them to the module
        _.each(_this.modules, function(module) {
          var call = $q(function(resolve, reject) {
            ModulesService.query({
              id: module.id,
              controller: 'channels'
            }, function(channels) {
              $log.debug('Framework sent', channels, 'on', module.id + ':channels');

              events.publish(module.id + ':channels', channels);

              // Send data from channels defined by the module
              _.each(channels, function(channel) {
                dataStore.get(channel.topic, function(data, error) {
                  $log.debug('Framework sent', data, 'on', module.id + ':' + channel.route);

                  events.publish(module.id + ':' + channel.route, {
                    data: data,
                    error: error
                  });
                });
              });

              resolve();
            }, function(error) {
              reject();
            });
          });

          calls.push(call);
        });

        events.subscribe('get', function(data) {
          $log.debug('Framework got', data, 'on', 'get');

          dataStore.get(data.topic, function(_data, error) {
            $log.debug('Framework sent', _data, 'on', data.caller);

            events.publish(data.caller, {
              data: _data,
              error: error
            });
          });
        });

        events.subscribe('post', function(data) {
          $log.debug('Framework got', data, 'on', 'post');

          dataStore.post(data.topic, data.payload, function(_data, error) {
            $log.debug('Framework sent', _data, 'on', data.caller);

            events.publish(data.caller, {
              data: _data,
              error: error
            });
          });
        });

        $q.all(calls).then(function() {
          callback();
        });
      }

      return {
        discover: _discover,
        init: _init
      }
    }]
  });
})(window.angular, window.events, window._, window.$);
(function(angular) {
  /**
   * Resource for retrieving Modules
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/modules
   *  - /v1/modules/1
   *  - /v1/modules/1/channels
   */
  angular.module('sis.api').factory('ModulesService', ['$resource', 'url', 'version', function($resource,
    url, version) {
    return $resource(url + version + '/modules/:id/:controller/:verb/:action', {
      id: '@id',
      controller: '@controller',
      verb: '@verb',
      action: '@action'
    });
  }]);
})(window.angular);
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
  angular.module('sis.api').factory('UtilitiesService', ['$resource', 'url', 'version', function($resource,
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
  }]);
})(window.angular);
(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the modules inserted on the page
   */
  angular.module('sis.modules').provider('sisViews', function() {
    this.$get = ['$injector', '$q', '$log', '$compile', '$rootScope', 'FacilitiesService', 'LayoutsService', 'ViewsService', 'path', function($injector, $q, $log, $compile, $rootScope, FacilitiesService, LayoutsService, ViewsService, path) {
      var _this = this;

      /**
       * Search for the view
       */
      var _load = function(options, callback) {
        FacilitiesService.query({
          id: options.id,
          controller: 'views',
          slug: options.slug
        }, function(views) {
          $log.debug(views);

          var view = views[0];

          LayoutsService.get({
            id: view.layout_id
          }, function(layout) {
            $log.debug(layout);

            $rootScope.tpl = path + layout.slug + '/' + layout.slug + '.html';

            $rootScope.$on('$includeContentLoaded', function() {
              var placeholders = $('.placeholder');

              ViewsService.query({
                id: view.id,
                controller: 'modules'
              }, function(modules) {
                $log.debug(modules);

                _.each(placeholders, function(placeholder) {
                  var module = _.findWhere(modules, {placeholder: placeholder.id});

                  if (module) {
                    var module_element = $compile('<' + module.slug + ' class="module" data-id="' + module.id + '">')($rootScope);

                    angular.element(placeholder).append(module_element);
                  }
                });

                callback();
              });
            });
          });
        });
      }

      return {
        load: _load,
      }
    }]
  });
})(window.angular, window.events, window._, window.$);
(function(angular) {
  /**
   * Resource for retrieving Views
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/views
   *  - /v1/views/1
   *  - /v1/views/1/modules
   *  - /v1/views?organization_id=1
   */
  angular.module('sis.api').factory('ViewsService', ['$resource', 'url', 'version', function($resource,
    url, version) {
    return $resource(url + version + '/views/:id/:controller/:verb/:action', {
      id: '@id',
      controller: '@controller',
      verb: '@verb',
      action: '@action'
    });
  }]);
})(window.angular);
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