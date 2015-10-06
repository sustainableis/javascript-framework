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
  angular.module('sis.api').factory('authInterceptor', ['$q', 'sisToken', 'sisApi', function($q, sisToken, sisApi) {
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
  angular.module('sis.modules').config(['$sceDelegateProvider', '$compileProvider', '$filterProvider', '$ocLazyLoadProvider', '$logProvider', 'sisModulesProvider', function($sceDelegateProvider,
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
  }]);
})(window.angular, window._);

(function(angular) {
  /**
   * Provider for configuring sis.api variables
   */
  angular.module('sis.api').provider('sisApi', function() {
    this.url = 'http://api.sustainableis.com/';
    this.version = 'v1';

    this.$get = function() {
      return {
        url: this.url,
        version: this.version
      };
    };
  });
})(window.angular);

(function(angular) {
  /**
   * Resource for retrieving Areas
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/areas
   *  - /v1/areas/1
   *  - /v1/areas/1/outputs
   *  - /v1/areas/1/outputs?type=temperature
   */
  angular.module('sis.api').factory('AreasService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/areas/:id/:controller/:verb/:action', {
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
   * Resource for makeing Batch requests
   *
   * Endpoints example:
   *  - /v1/batch
   */
  angular.module('sis.api').factory('BatchService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/batch', {}, {
      'update': {
        method: 'PUT'
      }
    });
  }]);
})(window.angular);

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
  angular.module('sis.api').factory('BuildingsService', ['$resource', 'sisApi', function($resource, sisApi) {
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
  }]);
})(window.angular);

(function(angular) {
  /**
   * Resource for retrieving Configurations
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/configurations
   *  - /v1/configurations/1
   *  - /v1/configurations/1/values
   */
  angular.module('sis.api').factory('ConfigurationsService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/configurations/:id/:controller/:verb/:action', {
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
      this.expires = 300;

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
         * @param {boolean} [cache=true]
         */
        var _get = function(topic, callback, cache) {
          //cache = cache === undefined ? true : cache;
          cache = false; // disabling cache for now

          if (_.has(_this.cache, topic) && cache === true) {
            if (moment().diff(_this.cache[topic].added, 'seconds') < _this.expires) {
              $log.debug('Returned', _this.cache[topic].data, 'from cache', 'for topic', topic);

              return callback(_this.cache[topic].data);
            } else {
              $log.debug('Hit missed to cache for topic', topic);
            }
          }

          _call(GET, topic, null, function(data, error) {
            $log.debug('Returned', data, 'from API', 'for topic', topic);

            _this.cache[topic] = {
              data: data,
              added: moment()
            };

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
  angular.module('sis.api').factory('FacilitiesService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/facilities/:id/:controller/:verb/:action', {
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
  angular.module('sis.api').factory('FeedsService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/feeds/:id/:controller/:verb', {
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
   * Resource for retrieving Fields
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {number|string} metric_name
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/fields
   *  - /v1/fields/1/metrics
   *  - /v1/fields/1/metrics/:metric_name/data
   */
  angular.module('sis.api').factory('FieldsService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/fields/:id/:controller/:metric_name/:verb', {
      id: '@id',
      controller: '@controller',
      metric_name: '@metric_name',
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
  angular.module('sis.api').factory('FilesService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/files/:id/:verb', {
      id: '@id',
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
   * Resource for retrieving Groups
   *
   * @param {number|string} id
   * @param {string} controller
   * @param {string} verb
   *
   * Endpoints example:
   *  - /v1/groups
   */
  angular.module('sis.api').factory('GroupsService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/groups/:id/:controller/:verb', {
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
    this.path = null;

    this.$get = ['$injector', '$q', '$log', '$rootScope', '$compile', '$timeout', '$ocLazyLoad', 'dataStore', function($injector, $q, $log, $rootScope, $compile, $timeout,
      $ocLazyLoad, dataStore) {
      var _this = this,
        reserved_channels_initialized = false;

      var _init_reserved_channels = function() {
        // Do not allow the reserved channels to be initialized twice
        if (reserved_channels_initialized) {
          return;
        }

        reserved_channels_initialized = true;

        events.subscribe('get', function(data) {
          $log.debug('Framework got', data, 'on', 'get');

          dataStore.get(data.topic, function(_data, error) {
            $log.debug('Framework sent', _data, 'on', data.caller);

            events.publish(data.caller, {
              data: _data,
              error: error
            });
          }, data.cache);
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
      var _init = function(callback, options) {
        var modules = [],
          requests = [],
          _options = options || {},
          scope = _options.scope || $rootScope.$new(true);

        if (_.has(_options, 'container')) {
          modules = angular.element(_options.container + ' .module');
        } else {
          modules = angular.element('.module');
        }

        _init_reserved_channels();

        _.each(modules, function(module) {
          var id = angular.element(module).data('id'),
            version = angular.element(module).data('version'),
            tag = angular.element(module).prop('tagName').toLowerCase(),
            path = _this.path + '/dist/' + tag + '/' + version + '/' + tag + '.min';

          var request = $ocLazyLoad.load({
            serie: true,
            files: [
              // Preload in this order: css -> html -> js
              path + '.css',
              path + '.html',
              path + '.js'
            ]
          }).then(function() {
            _send_channels_data(id);
          }, function() {
            $log.error('Module', tag, ':', id, '@', version, 'is missing files');
          });

          requests.push(request);

          $rootScope.$on('ocLazyLoad.fileLoaded', function(e, file) {
            if (file === path + '.js') {
              $compile(module)(scope);
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
        //reserved_channels_initialized = false;
      };

      return {
        init: _init,
        destroy: _destroy,
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
  angular.module('sis.api').factory('ModulesService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/modules/:id/:controller/:verb/:action', {
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
  angular.module('sis.api').factory('OauthService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + 'oauth/:controller', {
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
  angular.module('sis.api').factory('OrganizationsService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/organizations/:id/:controller/:verb', {
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
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/outputs
   *  - /v1/outputs/1
   *  - /v1/outputs/1/fields
   *  - /v1/outputs?facility_id=1
   *  - /v1/outputs/types
   *  - /v1/outputs/1/fields/Tmp-2/data
   */
  angular.module('sis.api').factory('OutputsService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/outputs/:id/:controller/:verb/:action', {
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
  angular.module('sis.api').factory('RatesService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/rates/:controller/:id/:verb/:second_id/:action', {
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
  angular.module('sis.api').factory('UsersService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/users/:id/:controller/:verb', {
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
  angular.module('sis.api').factory('UtilitiesService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/utilities/:controller/:id/:verb/:verb_id', {
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
    this.$get = ['$log', '$compile', '$ocLazyLoad', '$q', '$rootScope', 'dataStore', 'sisModules', function($log, $compile, $ocLazyLoad, $q, $rootScope, dataStore,
      sisModules) {
      var _this = this;

      /**
       * Builds an internal list with modules embedded on the page and loads
       * script files
       */
      var _init = function(callback, options) {
        var views = angular.element('.__view__'),
          requests = [],
          _options = options || {},
          scope = _options.scope || $rootScope.$new(true);

        _.each(views, function(view) {
          var id = angular.element(view).data('id'),
            version = angular.element(view).data('version'),
            tag = angular.element(view).prop('tagName').toLowerCase(),
            path = sisModules.path + '/dist/' + tag + '/' + version + '/' + tag + '.min',
            request = $q.defer();

          $ocLazyLoad.load({
            serie: true,
            files: [
              // Preload in this order: css -> html -> js
              path + '.css',
              path + '.html',
              path + '.js'
            ]
          }).then(function() {
            dataStore.get('service:views/id:' + id + '/controller:modules',
              function(modules, error) {
                var placeholders = $(tag + ' .placeholder');

                _.each(placeholders, function(placeholder) {
                  var module = _.findWhere(modules, {
                    placeholder: placeholder.id
                  });

                  if (module) {
                    var module_markup = '<' + module.slug + ' class="module" data-id="' +
                      module.id + '" data-version="' + module.version + '">';

                    module_element = $compile(module_markup)(scope);

                    angular.element(placeholder).empty();
                    angular.element(placeholder).append(module_element);
                  }
                });

                request.resolve();
              }
            );
          }, function() {
            $log.error('Module', tag, ':', id, '@', version, 'is missing files');
          });

          $rootScope.$on('ocLazyLoad.fileLoaded', function(e, file) {
            if (file === path + '.js') {
              $compile(view)(scope);
            }
          });

          requests.push(request.promise);
        });

        $q.all(requests).then(callback);
      };

      return {
        init: _init
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
  angular.module('sis.api').factory('ViewsService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/views/:id/:controller/:verb/:action', {
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
   * @param {string} action
   *
   * Endpoints example:
   *  - /v1/weather
   *  - /v1/weather/accounts
   *  - /v1/weather/accounts/1
   *  - /v1/weather/locations/1/types
   *  - /v1/weather/locations/1/forecast/hourly
   */
  angular.module('sis.api').factory('WeatherService', ['$resource', 'sisApi', function($resource, sisApi) {
    return $resource(sisApi.url + sisApi.version + '/weather/:controller/:id/:verb/:action', {
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
