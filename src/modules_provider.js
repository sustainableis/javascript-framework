(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the modules inserted on the page
   */
  angular.module('sis.modules').provider('sisModules', function() {
    this.modules = [];

    this.$get = function($injector, $q, $log, dataStore, ModulesService) {
      var _this = this;

      /**
       * Builds an internal list with modules embedded on the page
       */
      var _discover = function() {
        // TODO: Inject jQuery or use something else for DOM selection
        var modules = $('.module');

        _.each(modules, function(module) {
          var id = angular.element(module).data('id');

          _this.modules.push({
            id: id
          });
        });
      }

      /**
       * Initialize the modules
       */
      var _init = function(callback) {
        var calls = [];

        // Get the channels for each module and send them to the module
        _.each(_this.modules, function(module) {
          var call = ModulesService.query({
            id: module.id,
            controller: 'channels'
          }, function(channels) {
            $log.debug('Framework sent', channels, 'on', module.id + ':channels');

            events.publish(module.id + ':channels', channels);

            // Send data from channels defined by the module
            _.each(channels, function(channel) {
              dataStore.get(channel.topic, function(data) {
                $log.debug('Framework sent', data, 'on', module.id + ':' + channel.route);

                events.publish(module.id + ':' + channel.route, data);
              });
            });
          });

          calls.push(call);
        });

        $q.all(calls).then(function() {
          callback();

          events.subscribe('get', function(data) {
            $log.debug('Framework got', data, 'on', 'get');

            dataStore.get(data.channel, function(_data) {
              $log.debug('Framework sent', _data, 'on', data.caller);

              events.publish(data.caller, _data);
            });
          });

          events.subscribe('post', function(data) {
            $log.debug('Framework got', data, 'on', 'post');

            dataStore.post(data.topic, data.payload, function(_data) {
              $log.debug('Framework sent', _data, 'on', data.caller);

              events.publish(data.caller, _data);
            });
          });
        });
      }

      return {
        discover: _discover,
        init: _init
      }
    }
  });
})(window.angular, window.events, window._, window.$);