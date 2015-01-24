'use strict';

(function(angular) {
    /**
     * Provider for managing API calls
     */
    angular.module('sis.modules').provider('dataStore', function() {
        this.cache = {};

        this.$get = [
            '$injector',
            '$log',
            'OauthService',
            'FacilitiesService',
            'OrganizationsService',
            'BuildingsService',
            'FeedsService',
            'OutputsService',
            'UsersService',
            'WeatherService',
            function($injector,
                    $log,
                    OauthService,
                    FacilitiesService,
                    OrganizationsService,
                    BuildingssService,
                    FeedsService,
                    OutputsService,
                    UsersService,
                    WeatherService) {
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
                 * @param {function} callback
                 */
                var _call = function(topic, callback) {
                    var topic = _decode_topic(topic),
                        service_name = topic.service.charAt(0).toUpperCase() +
                                        topic.service.slice(1) + 'Service',
                        service = $injector.get(service_name),
                        call_params = _.omit(topic, 'service');

                    // TODO: Call query or get depending on the response (array or not)
                    // TODO: Handle failed responses
                    service.query(call_params, function(data) {
                        callback(data);
                    });
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

                    _call(topic, function(data) {
                        $log.debug('Returned', data, 'from API', 'for topic', topic);

                        _this.cache[topic] = data;

                        callback(data);
                    });
                }

                return {
                    get: _get
                }
            }
        ];
    });
// TODO: Inject underscore
})(window.angular);
