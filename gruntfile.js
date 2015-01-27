module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
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
                mangle: true // Don't change variable and function names
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': [
                        'dist/<%= pkg.name %>.js',
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['ngAnnotate:dist', 'concat:dist', 'uglify:dist']);
}