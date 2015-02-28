(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the modules inserted on the page
   */
  angular.module('sis.modules').provider('sisModules', function() {
    this.path = null;

    this.$get = function($injector, $q, $log, $rootScope, $compile, dataStore) {
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
          var id = angular.element(module).data('id'),
              parent = angular.element(module).parent(),
              tag = angular.element(module).prop('tagName').toLowerCase(),
              script = document.createElement('script'),
              link = document.createElement('link');

          _modules.push({
            id: id,
            tag: tag
          });

          angular.element(module).remove();

          script.src = _this.path + tag + '/' + tag + '.js';

          link.rel = 'stylesheet';
          link.href = _this.path + tag + '/' + tag + '.css';

          var load = $q(function(resolve, reject) {
            script.onload = function() {
              var new_module = $compile(module)($rootScope);

              parent.append(new_module);

              resolve();
            }
          });

          loads.push(load);

          document.getElementsByTagName('head')[0].appendChild(script);
          document.getElementsByTagName('head')[0].appendChild(link);
        });

        $q.all(loads).then(function() {
          callback();
        });
      }

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
        _.each(_modules, function(module) {
          var src = _this.path + module.tag + '/' + module.tag + '.js',
              href = _this.path + module.tag + '/' + module.tag + '.css',
              scripts = angular.element('head').find('script'),
              links = angular.element('head').find('link');

          _.each(scripts, function(script) {
            if (script.src === src) {
              angular.element(script).remove();
            }
          });

          _.each(links, function(link) {
            if (link.href === href) {
              angular.element(link).remove();
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
        _modules = [];
      }

      return {
        discover: _discover,
        init: _init,
        destroy: _destroy,
        path: this.path
      }
    }
  });
})(window.angular, window.events, window._, window.$);