(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the modules inserted on the page
   */
  angular.module('sis.modules').provider('sisModules', function() {
    this.modules = [];

    this.$get = function($injector, $q, $log, $rootScope, $compile, dataStore, ModulesService, path) {
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

          _this.modules.push({
            id: id,
            tag: tag
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

      /*
       * Destroy the modules on the page when a view that has modules
       * instantiated is destroyed
       */
      var _destroy = function() {
        // Remove script tags for the modules
        _.each(_this.modules, function(module) {
          var src = path + module.tag + '/' + module.tag + '.js',
              scripts = angular.element('head').find('script');

          _.each(scripts, function(script) {
            if (script.src === src) {
              angular.element(script).remove();
            }
          });
        });

        /*
          TODO: Review this process
          For pages with multiple views and each view has modules instantiated,
          clearing all the events listeners and reseting the modules list might
          cause issues. The destroy event is triggered when a view is destroyed.
         */

        // Remove all events listeners
        events.purge();

        // Reset the modules list
        _this.modules = [];
      }

      return {
        discover: _discover,
        init: _init,
        destroy: _destroy
      }
    }
  });
})(window.angular, window.events, window._, window.$);