'use strict';

(function(angular) {
    /**
     * ModulesService mockup. It's temporary. It will be replaced with a proper
     * resource when the API implementation for the endpoints is ready.
     */
    angular.module('sis.api').factory('ModulesService', [
        '$resource',
        function($resource) {
            var modules = [
                {
                    id: 1,
                    tag: 'table-module-angular'
                },
                {
                    id: 2,
                    tag: 'table-module-angular'
                },
                {
                    id: 3,
                    tag: 'dropdown-module-angular'
                },
                {
                    id: 4,
                    tag: 'table-module'
                }
            ];

            var configurations = [
                {
                    id: 1,
                    module_id: 1,
                    refresh: 10,
                    stale: 60,
                    name: 'Feeds for Facility',
                    headers: JSON.stringify(['Id', 'Created At', 'description', 'Key'])
                },
                {
                    id: 2,
                    module_id: 2,
                    refresh: 10,
                    stale: 60,
                    name: 'Outputs for Facility',
                    headers: JSON.stringify(['Id', 'Created At', 'description', 'Key'])
                },
                {
                    id: 3,
                    module_id: 3,
                    refresh: 10,
                    stale: 60,
                    name: 'Select Facility'
                },
                {
                    id: 4,
                    module_id: 4,
                    refresh: 10,
                    stale: 60,
                    name: 'Polymer table module',
                    headers: JSON.stringify(['Id', 'Created At', 'description', 'Key'])

                }
            ];

            var channels = [
                {
                    id: 1,
                    module_id: 1,
                    route: 'data',
                    topic: 'service:facilities/id:1/controller:feeds'
                },
                {
                    id: 2,
                    module_id: 1,
                    route: 'configuration',
                    topic: 'service:modules/id:1/controller:configuration'
                },
                {
                    id: 3,
                    module_id: 2,
                    route: 'data',
                    topic: 'service:facilities/id:1/controller:outputs'
                },
                {
                    id: 4,
                    module_id: 2,
                    route: 'configuration',
                    topic: 'service:modules/id:2/controller:configuration'
                },
                {
                    id: 5,
                    module_id: 3,
                    route: 'data',
                    topic: 'service:facilities'
                },
                {
                    id: 6,
                    module_id: 3,
                    route: 'configuration',
                    topic: 'service:modules/id:3/controller:configuration'
                },
                {
                    id: 7,
                    module_id: 4,
                    route: 'data',
                    topic: 'service:facilities/id:1/controller:feeds'
                },
                {
                    id: 8,
                    module_id: 4,
                    route: 'configuration',
                    topic: 'service:modules/id:1/controller:configuration'
                }
            ];

            return {
                // /modules/:id:/controller
                query: function(options, callback) {
                    var results;

                    switch(options.controller) {
                        case 'configuration':
                            results = _.findWhere(configurations, {
                                module_id: parseInt(options.id)
                            });
                        break;

                        case 'channels':
                            results = _.where(channels, {
                                module_id: options.id
                            });
                        break;

                        default:
                            results = _.findWhere(modules, {
                                id: options.id
                            });
                        break;
                    }

                    callback(results);
                }
            }
        }
    ]);
})(window.angular);
