
module.exports = function(grunt){

    grunt.initConfig({

        compass: {
            dist: {
                options: {
                    sassDir: 'scss/',
                    cssDir: 'css/'
                }
            }
        },

        sprite: {

            sass: {
                src: 'img/sprites/*.png',
                dest: 'img/spritesheet.png',
                destCss: 'scss/_sprites.scss'
            },

            less: {
                src: 'img/sprites/*.png',
                dest: 'img/spritesheet.png',
                destCss: 'less/_sprites.less'
            }

        },

        concat: {
            dist: {
                src: [
                    'js/intro.js',
                    'js/helpers/*.js',
                    'js/components/*.js',
                    'js/modules/*.js',
                    'js/ImageViewer.js',
                    'js/outro.js'
                ],
                dest: 'js/ImageViewer.build.js',
            },
        },

        uglify: {
            js: {
                expand: true,
                files: {
                'js/ImageViewer.min.js': 'js/ImageViewer.build.js'
                }
            }
        },

        watch: {

            css: {
                files: ['scss/**/*'],
                tasks: ['compass'],
                options: {
                    spawn: false
                }
            },

            js: {
                files: ['js/**/*.js', '!js/ImageViewer.min.js'],
                tasks: ['concat','uglify'],
                options: {
                    spawn: false
                }
            }
        },

    });

    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-spritesmith');

    grunt.registerTask('default', ['compass','concat']);
    grunt.registerTask('dev', ['default','watch']);


}
