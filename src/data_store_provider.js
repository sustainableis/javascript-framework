  (function(angular, _) {
    /**
     * Provider for managing API calls
     */
    angular.module('sis.modules').provider('dataStore', function() {
      this.cache = {};
      this.expires = 300;

      this.$get = function($injector, $log, OauthService, FacilitiesService,
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
      };
    });
  })(window.angular, window._);
