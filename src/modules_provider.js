(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the modules inserted on the page
   */
  angular.module('sis.modules').provider('sisModules', function() {
    this.path = null;

    this.$get = function($injector, $q, $log, $rootScope, $compile, $timeout,
      $ocLazyLoad, dataStore) {
      var _this = this,
        _modules = [];

      /**
       * Builds an internal list with modules embedded on the page and loads
       * script files
       */
      var _discover = function(callback) {
        var modules = angular.element('.module'),
          loads = [];

        _.each(modules, function(module) {
          var parent = angular.element(module).parent(),
            id = angular.element(module).data('id'),
            version = angular.element(module).data('version'),
            tag = angular.element(module).prop('tagName').toLowerCase();

          var _module = {
            id: id,
            tag: tag,
            version: version
          };

          _modules.push(_module);

          var load = $ocLazyLoad.load({
            // TODO: Set serie to false after some more tests
            serie: true,
            files: [
              // Preload the html template
              _this.path + '/dist/' + tag + '/' + version + '/' + tag + '.min.html',
              _this.path + '/dist/' + tag + '/' + version + '/' + tag + '.min.js',
              _this.path + '/dist/' + tag + '/' + version + '/' + tag + '.min.css'
            ]
          });

          loads.push(load);

          $rootScope.$on('ocLazyLoad.fileLoaded', function(e, file) {
            if (file === _this.path + '/dist/' + tag + '/' + version + '/' + tag + '.min.js') {
              $compile(module)($rootScope);
            }
          });
        });

        $q.all(loads).then(callback);
      };

      /**
       * Initialize the modules
       */
      var _init = function(callback) {
        var calls = [];

        // Get the channels for each module and send them to the module
        _.each(_modules, function(module) {
          var call = $q(function(resolve, reject) {
            dataStore.get('service:modules/id:' + module.id + '/controller:channels',
              function(data, error) {
                if (error) {
                  return reject();
                }

                $log.debug('Framework sent', data, 'on', module.id + ':channels');

                events.publish(module.id + ':channels', data);

                // Send data from channels defined by the module
                _.each(data, function(channel) {
                  dataStore.get(channel.topic, function(_data, _error) {
                    $log.debug('Framework sent', _data, 'on', module.id + ':' +
                      channel.route);

                    events.publish(module.id + ':' + channel.route, {
                      data: _data,
                      error: _error
                    });
                  });
                });

                resolve();
              });
          });

          calls.push(call);
        });

        $q.all(calls).then(callback);

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

        // Reset the modules list
        _modules = [];
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
        discover: _discover,
        init: _init,
        destroy: _destroy,
        append: _append,
        path: this.path
      };
    };
  });
})(window.angular, window.events, window._, window.$);
