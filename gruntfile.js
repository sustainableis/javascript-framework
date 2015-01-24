module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: [
                    'src/events.js',
                    'src/framework.js',
                    'src/facilities_service.js',
                    'src/buildings_service.js',
                    'src/feeds_service.js',
                    'src/modules_service.js',
                    'src/oauth_service.js',
                    'src/organizations_service.js',
                    'src/outputs_service.js',
                    'src/users_service.js',
                    'src/weather_service.js',
                ],
                dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js',
            }
        },
        uglify: {
            options: {
                mangle: false // Don't change variable and function names
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': [
                        'dist/<%= pkg.name %>-<%= pkg.version %>.js',
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['concat:dist', 'uglify:dist']);
}
