(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the modules inserted on the page
   */
  angular.module('sis.modules').provider('sisViews', function() {
    this.$get = function($injector, $q, $log, $compile, FacilitiesService, LayoutsService, ViewsService, path) {
      var _this = this;

      /**
       * Search for the view
       */
      var _load = function(options, callback) {
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

            options.scope.tpl = path + layout.slug + '/' + layout.slug + '.html';

            options.scope.$on('$includeContentLoaded', function() {
              var placeholders = $('.placeholder');

              ViewsService.query({
                id: view.id,
                controller: 'modules'
              }, function(modules) {
                $log.debug(modules);

                _.each(placeholders, function(placeholder) {
                  var module = _.findWhere(modules, {placeholder: placeholder.id});

                  if (module) {
                    var script_tag = angular.element('<script>').attr({
                                        type: 'text/javascript',
                                        src: path + module.slug + '/' + module.slug + '.js'
                                      });
                    var module_tag = $compile('<' + module.slug + ' class="module" data-id="' + module.id + '">')(options.scope);

                    angular.element(placeholder).append(module_tag);
                    //angular.element('body').append(script_tag);
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