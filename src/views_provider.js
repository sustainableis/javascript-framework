(function(angular, events, _, $) {
  /**
   * Provider for orchestrating the modules inserted on the page
   */
  angular.module('sis.modules').provider('sisViews', function() {
    this.$get = function($injector, $q, $log, FacilitiesService, LayoutsService, path) {
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

            options.scope.$on('$includeContentLoaded', function(){
              callback();
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