module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: ['src/events.js', 'src/framework.js'],
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
                        'src/events.js',
                        'src/framework.js'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['concat:dist', 'uglify:dist']);
}
