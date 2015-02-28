(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the views inserted on the page
   */
  angular.module('sis.modules').provider('sisViews', function() {
    this.$get = function($injector, $q, $log, $compile, $rootScope,
      FacilitiesService, LayoutsService, ViewsService, sisConfiguration) {
      var _this = this;

      /**
       * Search for the view
       */
      var _load = function(options, callback) {
        // TODO: Use dataStore instead of the services directly
        FacilitiesService.query({
          id: options.id,
          controller: 'views',
          slug: options.slug
        }, function(views) {
          $log.debug(views);

          var view = views[0];

          LayoutsService.get({
            id: view.layout_id
          }, function(layout) {
            $log.debug(layout);

            $rootScope.tpl = sisConfiguration.path + layout.slug + '/' + layout.slug + '.html';

            $rootScope.$on('$includeContentLoaded', function() {
              var placeholders = $('.placeholder');

              ViewsService.query({
                id: view.id,
                controller: 'modules'
              }, function(modules) {
                $log.debug(modules);

                _.each(placeholders, function(placeholder) {
                  var module = _.findWhere(modules, {placeholder: placeholder.id});

                  if (module) {
                    var module_markup = '<' + module.slug + ' class="module" data-id="' +
                                        module.id + '">';
                        module_element = $compile(module_markup)($rootScope);

                    angular.element(placeholder).append(module_element);
                  }
                });

                callback();
              });
            });
          });
        });
      }

      return {
        load: _load,
      }
    }
  });
})(window.angular, window.events, window._, window.$);