'use strict';

(function(angular, events) {
    /**
     * Provider for orchestrating the modules inserted on the page
     */
    angular.module('sis.modules').provider('sisModules', function() {
        this.modules = [];

        this.$get = [
            '$injector',
            '$q',
            '$log',
            'dataStore',
            'ModulesService',
            function($injector,
                    $q,
                    $log,
                    dataStore,
                    ModulesService) {
                var _this = this;

                /**
                 * Builds an internal list with modules embedded on the page
                 */
                var _discover = function() {
                    // TODO: Inject jQuery or use something else for DOM selection
                    var modules = $('.module');

                    _.each(modules, function(module) {
                        var id = angular.element(module).data('id');

                        _this.modules.push({id: id});
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
                            }, function(data) {
                                module['channels'] = data;

                                $log.debug('Framework sent', data, 'on', module.id + ':channels');

                                events.publish(module.id + ':channels', data);
                            });

                        calls.push(call);
                    });

                    // When all the channels are retrieved get data from them
                    $q.all(calls).then(function() {
                        callback();

                        events.subscribe('new', function(data) {
                            $log.debug('Framework got', data, 'on', 'new');

                            dataStore.get(data.channel, function(_data) {
                                $log.debug('Framework sent', _data, 'on', data.caller);

                                events.publish(data.caller, _data);
                            });
                        });

                        events.subscribe('refresh', function(data) {
                            $log.debug('Framework got', data, 'on', 'new');
                        });

                        _.each(_this.modules, function(module) {
                            // Send data to the module for each channel
                            // TODO: Probably it's best to get data as soon as the channels are retrieved for each module
                            _.each(module.channels, function(channel) {
                                // Subscribe to all channels in the framework as well to enable two-way communication
                                events.subscribe(channel.topic, function(data) {
                                    $log.debug('Framework got', data, 'on', channel.topic);
                                });

                                dataStore.get(channel.topic, function(data) {
                                    $log.debug('Framework sent', data, 'on', module.id + ':' + channel.route);

                                    events.publish(module.id + ':' + channel.route, data);
                                });

                            });
                        });
                    });
                }

                return {
                    discover: _discover,
                    init: _init
                }
            }
        ];
    });
// TODO: Inject underscore and jquery
})(window.angular, window.events);
