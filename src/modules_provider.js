(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the modules inserted on the page
   */
  angular.module('sis.modules').provider('sisModules', function() {
    this.path = null;

    this.$get = function($injector, $q, $log, $rootScope, $compile, $timeout,
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

      var _initFor = function(options) {

        var callback = options.callback;

        var modules = $(options.container + ' .module');
        var requests = [];

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
        initFor: _initFor,
        destroy: _destroy,
        append: _append,
        path: this.path
      };
    };
  });
})(window.angular, window.events, window._, window.$);
