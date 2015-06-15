(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the modules inserted on the page
   */
  angular.module('sis.modules').provider('sisModules', function() {
    this.path = null;

    this.$get = function($injector, $q, $log, $rootScope, $compile, $timeout,
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
          scope = _options.scope || $rootScope;

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
              // Preload the html template
              path + '.html',
              path + '.js',
              path + '.css'
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
    };
  });
})(window.angular, window.events, window._, window.$);
