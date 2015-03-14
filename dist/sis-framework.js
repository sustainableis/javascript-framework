(function(angular, _) {
  angular.module('sis', [
    'ngResource',
    'oc.lazyLoad'
  ]);

  angular.module('sis.api', ['sis']);
  angular.module('sis.modules', ['sis']);

  angular.module('sis.api').constant('url', 'http://api.sustainableis.com/');
  angular.module('sis.api').constant('version', 'v1');
  angular.module('sis.api').value('sisToken', {});

  /**
   * Interceptor for requests that sets the Authorization header
   */
  angular.module('sis.api').factory('authInterceptor', ['$q', 'sisToken', function($q, sisToken) {
    return {
      request: function(config) {
        config.headers = config.headers || {};

        if (config.data && typeof config.data === 'object') {
          config.data = $.param(config.data);
        }

        if (sisToken.access_token) {
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
  }]);

  /**
   * Configuration for the sis.api module
   */
  angular.module('sis.api').config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.headers.post['Content-Type'] =
      'application/x-www-form-urlencoded; charset=UTF-8;';
    $httpProvider.defaults.headers.put['Content-Type'] =
      'application/x-www-form-urlencoded; charset=UTF-8;';

    // $httpProvider.defaults.useXDomain = true;
    // delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $httpProvider.interceptors.push('authInterceptor');
  }]);

  /**
   * Configuration for the sis.modules module
   */
  angular.module('sis.modules').config(['$sceDelegateProvider', '$compileProvider', '$ocLazyLoadProvider', 'sisModulesProvider', function($sceDelegateProvider,
    $compileProvider, $ocLazyLoadProvider, sisModulesProvider) {

    // TODO: Find a better way. Must delay because the sisModulesProvider has to be set
    setTimeout(function() {
      // Allow to load remote directives
      $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        sisModulesProvider.path + '/**'
      ]);
    });

    $ocLazyLoadProvider.config({
      debug: true,
      events: true
    });

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

          return _.extend(configuration, default_configuration);
        }
      ]);
    };
  }]);
})(window.angular, window._);

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
  angular.module('sis.api').factory('BuildingsService', ['$resource', 'url', 'version', function($resource,
    url, version) {
    return $resource(url + version + '/buildings/:id/:controller/:verb/:action', {
      id: '@id',
      controller: '@controller',
      verb: '@verb',
      action: '@action'
    }, {
      'update': {
        method: 'PUT'
      }
    });
  }]);
})(window.angular);

  (function(angular, _) {
    /**
     * Provider for managing API calls
     */
    angular.module('sis.modules').provider('dataStore', function() {
      this.cache = {};

      this.$get = ['$injector', '$log', 'OauthService', 'FacilitiesService', 'OrganizationsService', 'BuildingsService', 'FeedsService', 'OutputsService', 'UsersService', 'WeatherService', function($injector, $log, OauthService, FacilitiesService,
        OrganizationsService, BuildingsService, FeedsService, OutputsService,
        UsersService, WeatherService) {
        var _this = this,
          GET = 0,
          POST = 1,
          PUT = 2,
          DELETE = 3;

        /**
         * Decode topic to object which can be passed to the service.
         * Note: Filters are not differentiated because there is not need
         * to. The AngularJS Resource knows to add the filter properly
         * based on its declaration.
         * If the 'service' key starts with '@' then mark the response to be an
         * object instead of an array.
         *
         * @param {string} topic
         *
         * Topics example:
         *  - service:modules/id:1/controller:configuration
         *  - service:facilities/id:1/controller:feeds/type:egauge
         *  - @service:rates/controller:schedules/id:1/verb:periods/action:current
         */
        var _decode_topic = function(topic) {
          var decoded = {},
            components = topic.split('/');

          _.each(components, function(component) {
            var _components = component.split(':'),
              key = _components[0],
              value = _components[1];

            if (key === '@service') {
              decoded.is__object = true;

              key = 'service';
            }

            decoded[key] = value;
          });

          return decoded;
        };

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
          var decoded_topic = _decode_topic(topic),
            service_name = decoded_topic.service.charAt(0).toUpperCase() +
            decoded_topic.service.slice(1) + 'Service',
            service = $injector.get(service_name),
            call_params = _.omit(decoded_topic, ['service', 'is__object']);

          switch (method) {
            case GET:
              if (_.has(decoded_topic, 'is__object')) {
                service.get(call_params,
                  function(data) {
                    callback(data);
                  },
                  function(error) {
                    $log.error(error);

                    callback(null, error);
                  });
              } else {
                service.query(call_params,
                  function(data) {
                    callback(data);
                  },
                  function(error) {
                    $log.error(error);

                    callback(null, error);
                  });
              }
              break;

            case POST:
              service.save(call_params, payload,
                function(data) {
                  callback(data);
                },
                function(error) {
                  $log.error(error);

                  callback(null, error);
                });
              break;

            case PUT:
              if (!_.has(service, 'update')) {
                return callback(null, service_name + 'has not method update');
              }

              service.update(call_params, payload,
                function(data) {
                  callback(data);
                },
                function(error) {
                  $log.error(error);

                  callback(null, error);
                });
              break;

            case DELETE:
              service.delete(call_params,
                function(data) {
                  callback(data);
                },
                function(error) {
                  $log.error(error);

                  callback(null, error);
                });
              break;

            default:
              callback(null, 'Invalid method', method, 'for calling', topic);
          }
        };

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

          _call(GET, topic, null, function(data, error) {
            $log.debug('Returned', data, 'from API', 'for topic', topic);

            _this.cache[topic] = data;

            callback(data, error);
          });
        };

        /**
         * Post data for a topic to the API
         *
         * @param {string} topic
         * @param {object} payload
         * @param {function} callback
         */
        var _post = function(topic, payload, callback) {
          _call(POST, topic, payload, function(data, error) {
            $log.debug('Returned', data, 'from API', 'for topic', topic);

            callback(data, error);
          });
        };

        /**
         * Put data for a topic to the API
         *
         * @param {string} topic
         * @param {object} payload
         * @param {function} callback
         */
        var _put = function(topic, payload, callback) {
          _call(PUT, topic, payload, function(data, error) {
            $log.debug('Returned', data, 'from API', 'for topic', topic);

            callback(data, error);
          });
        };

        /**
         * Delete data for a topic to the API
         *
         * @param {string} topic
         * @param {function} callback
         */
        var _delete = function(topic, callback) {
          _call(DELETE, topic, function(data, error) {
            $log.debug('Returned', data, 'from API', 'for topic', topic);

            callback(data, error);
          });
        };

        return {
          get: _get,
          post: _post,
          put: _put,
          'delete': _delete
        };
      }];
    });
  })(window.angular, window._);

(function() {
  var topics = {};

  var _subscribe = function(topic, listener) {
    if (!topics.hasOwnProperty(topic)) {
      topics[topic] = [];
    }

    var index = topics[topic].push(listener) - 1;

    return {
      remove: function() {
        delete topics[topic][index];
      }
    };
  };

  var _publish = function(topic, message) {
    if (!topics.hasOwnProperty(topic)) {
      return;
    }

    var _message = message || {};

    topics[topic].forEach(function(listener) {
      listener(_message);
    });
  };

  var _purge = function() {
    topics = {};
  };

  window.events = {
    subscribe: _subscribe,
    publish: _publish,
    purge: _purge,
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
    }, {
      'update': {
        method: 'PUT'
      }
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
    }, {
      'update': {
        method: 'PUT'
      }
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
    }, {
      'update': {
        method: 'PUT'
      }
    });
  }]);
})(window.angular);

(function(angular, _, $) {
  /**
   * Factory for handling layout modules
   */
  angular.module('sis.modules').provider('sisLayouts', function() {

    this.$get = ['$q', '$log', '$timeout', 'sisModules', 'LayoutsService', function($q, $log, $timeout, sisModules, LayoutsService) {
      var _layout_modules = [];

      /**
       * Fetches layout modules
       */
      var _fetch_modules = function(layout_id) {

        var fetch_modules_deferred = $q.defer();
        var layout_modules_resource = LayoutsService.query({
          id: layout_id,
          controller: 'modules'
        });

        layout_modules_resource.$promise
          .then(function(modules) {
            _layout_modules = _.clone(modules);
            fetch_modules_deferred.resolve();
          });

        return fetch_modules_deferred.promise;
      };

      var _append_modules = function(scope) {
        var append_deferred = $q.defer();
        var placeholders = $('.placeholder');

        _.each(placeholders, function(placeholder) {
          console.log('PLACEHOLDER', placeholder);
          var module = _.find(_layout_modules, {
            placeholder: placeholder.id
          });
          console.log('MODULE', module);
          sisModules
            .append({
              container: '.placeholder',
              slug: module.slug,
              id: module.id,
              version: '0.0.1',
              transclude: true,
              scope: scope
            });
        });

        append_deferred.resolve();
        return append_deferred.promise;
      };

      return {
        fetch_modules: _fetch_modules,
        append_modules: _append_modules
      };
    }];
  });
})(window.angular, window._, window.$);
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
  angular.module('sis.modules').provider('sisModules', function() {
    this.path = null;

    this.$get = ['$injector', '$q', '$log', '$rootScope', '$compile', '$timeout', '$ocLazyLoad', 'dataStore', function($injector, $q, $log, $rootScope, $compile, $timeout,
      $ocLazyLoad, dataStore) {
      var _this = this;

      var _init_reserved_channels = function() {
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

        events.subscribe('put', function(data) {
          $log.debug('Framework got', data, 'on', 'post');

          dataStore.put(data.topic, data.payload, function(_data, error) {
            $log.debug('Framework sent', _data, 'on', data.caller);

            events.publish(data.caller, {
              data: _data,
              error: error
            });
          });
        });

        events.subscribe('delete', function(data) {
          $log.debug('Framework got', data, 'on', 'post');

          dataStore.delete(data.topic, function(_data, error) {
            $log.debug('Framework sent', _data, 'on', data.caller);

            events.publish(data.caller, {
              data: _data,
              error: error
            });
          });
        });
      };

      var _send_channels_data = function(module_id) {
        // Get modules channels
        dataStore.get('service:modules/id:' + module_id + '/controller:channels',
          function(channels, error) {
            if (error) {
              return;
            }

            // Send data for each channels on the specified route
            _.each(channels, function(channel) {
              dataStore.get(channel.topic, function(data, _error) {
                $log.debug('Framework sent', data, 'on', module_id + ':' +
                  channel.route);

                events.publish(module_id + ':' + channel.route, {
                  data: data,
                  error: _error
                });
              });
            });
          }
        );
      };

      /**
       * Builds an internal list with modules embedded on the page and loads
       * script files
       */
      var _init = function(callback) {
        var modules = angular.element('.module'),
          requests = [];

        _init_reserved_channels();

        _.each(modules, function(module) {
          var id = angular.element(module).data('id'),
            version = angular.element(module).data('version'),
            tag = angular.element(module).prop('tagName').toLowerCase(),
            path = _this.path + '/dist/' + tag + '/' + version + '/' + tag + '.min';

          var request = $ocLazyLoad.load({
            serie: true,
            files: [
              // Preload the html template
              path + '.html',
              path + '.js',
              path + '.css'
            ]
          }).then(function() {
            _send_channels_data(id);
          });

          requests.push(request);

          $rootScope.$on('ocLazyLoad.fileLoaded', function(e, file) {
            if (file === path + '.js') {
              $compile(module)($rootScope);
            }
          });
        });

        $q.all(requests).then(callback);
      };

      /*
       * Destroy the modules on the page when a view that has modules
       * instantiated is destroyed
       */
      var _destroy = function() {
        /*
          TODO: Review this process
          For pages with multiple views and each view has modules instantiated,
          clearing all the events listeners and resetting the modules list might
          cause issues. The destroy event is triggered when a view is destroyed.
         */

        // Remove all events listeners
        events.purge();
      };

      var _append = function(options) {
        var append_deferred = $q.defer();

        var container_selector = options.container;
        var module_id = options.id;
        var module_slug = options.slug;
        var module_version = options.version;
        var transclude = options.transclude;
        var scope = options.scope;

        var container_elem = $($(container_selector)[0]);

        var module_elem = $compile(
          '<' +
          module_slug +
          ' data-id="' +
          module_id +
          '" data-version="' +
          module_version +
          '" class="module">',

          transclude)(scope);

        container_elem.append(module_elem);
        append_deferred.resolve();

        return append_deferred.promise;
      };

      return {
        init: _init,
        destroy: _destroy,
        append: _append,
        path: this.path
      };
    }];
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
    }, {
      'update': {
        method: 'PUT'
      }
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
    }, {
      'update': {
        method: 'PUT'
      }
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
    }, {
      'update': {
        method: 'PUT'
      }
    });
  }]);
})(window.angular);

(function(angular) {
  /**
   * Resource for retrieving Rates
   *
   * @param {string} controller
   * @param {number|string} id
   * @param {string} verb
   * @param {number|string} second_id
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/rates/schedules
   *  - /v1/rates/schedules/1
   *  - /v1/rates/schedules/1/periods
   *  - /v1/rates/schedules/1/periods/current
   *  - /v1/rates/seasons/1/periods/1/rates
   */
  angular.module('sis.api').factory('RatesService', ['$resource', 'url', 'version', function($resource,
    url, version) {
    return $resource(url + version + '/rates/:controller/:id/:verb/:second_id/:action', {
      controller: '@controller',
      id: '@id',
      verb: '@verb',
      second_id: '@second_id',
      action: '@action'
    }, {
      'update': {
        method: 'PUT'
      }
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
    }, {
      'update': {
        method: 'PUT'
      }
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
   * Provider for orchestrating the views inserted on the page
   */
  angular.module('sis.modules').provider('sisViews', function() {
    this.$get = ['$injector', '$q', '$log', '$compile', '$rootScope', 'FacilitiesService', 'LayoutsService', 'ViewsService', 'sisModules', function($injector, $q, $log, $compile, $rootScope,
      FacilitiesService, LayoutsService, ViewsService, sisModules) {
      var _this = this;

      /**
       * Search for the view
       */
      var _load = function(options, callback) {
        // TODO: Use dataStore instead of the services directly
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

            $rootScope.tpl = sisModules.path + '/dist/' + layout.slug + '/' +
              layout.version + '/' + layout.slug + '.min.html';

            $rootScope.$on('$includeContentLoaded', function() {
              var placeholders = $('.placeholder');

              ViewsService.query({
                id: view.id,
                controller: 'modules'
              }, function(modules) {
                $log.debug(modules);

                _.each(placeholders, function(placeholder) {
                  var module = _.findWhere(modules, {
                    placeholder: placeholder.id
                  });

                  if (module) {
                    var module_markup = '<' + module.slug + ' class="module" data-id="' +
                      module.id + '" data-version="' + module.version + '">';

                    module_element = $compile(module_markup)($rootScope);

                    angular.element(placeholder).append(module_element);
                  }
                });

                callback();
              });
            });
          });
        });
      };

      return {
        load: _load,
      };
    }];
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
  angular.module('sis.api').factory('ViewsService', ['$resource', 'url', 'version', function($resource, url,
    version) {
    return $resource(url + version + '/views/:id/:controller/:verb/:action', {
      id: '@id',
      controller: '@controller',
      verb: '@verb',
      action: '@action'
    }, {
      'update': {
        method: 'PUT'
      }
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
    }, {
      'update': {
        method: 'PUT'
      }
    });
  }]);
})(window.angular);
