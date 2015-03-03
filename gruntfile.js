module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        curly: true,
        //eqeqeq: true,
        eqnull: true,
        browser: true,
        globals: {
          angular: true,
          events: true,
          _: true,
          console: true
        }
      },
      dist: ['src/*']
    },
    ngAnnotate: {
      options: {
        singleQuotes: true
      },
      dist: {
        files: [{
          expand: true,
          src: 'src/**.js',
          dest: '.tmp/concat'
        }]
      }
    },
    concat: {
      dist: {
        src: [
          '.tmp/concat/src/framework.js',
          '.tmp/concat/src/**(!framework).js'
        ],
        dest: 'dist/<%= pkg.name %>.js',
      }
    },
    uglify: {
      options: {
        mangle: true
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', [
    'jshint:dist',
    'ngAnnotate:dist',
    'concat:dist',
    'uglify:dist'
  ]);
}
