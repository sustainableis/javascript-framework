(function(angular, _) {
  /**
   * Provider for managing API calls
   */
  angular.module('sis.modules').provider('dataStore', function() {
    this.cache = {};
    this.GET = 0;
    this.POST = 1;

    this.$get = function($injector, $log, OauthService, FacilitiesService,
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
    }
  });
})(window.angular, window._);