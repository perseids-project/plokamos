(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = function( root, jQuery ) {
            if ( jQuery === undefined ) {
                // require('jQuery') returns a factory that requires window to
                // build a jQuery instance, we normalize how we use modules
                // that require this pattern but the window provided is a noop
                // if it's defined (how jquery works)
                if ( typeof window !== 'undefined' ) {
                    jQuery = require('jquery');
                }
                else {
                    jQuery = require('jquery')(root);
                }
            }
            factory(jQuery);
            return jQuery;
        };
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.fn.marginotes = function (options) {
      options = options || {}
      var field = options.field || 'desc'
      var spans = this.filter('span')

      $('body').append('<div class="margintooltip" style="display: none;"></div>')
      spans.css({
        'border-bottom': '1px dashed #FF00FF',
        'cursor': 'pointer'
      })
      spans.hover(function (e) {

          function stringify(obj) {
              return _.values(_.mapValues(obj,function(v,k) {
                  var bonds = v
                      .filter(function(o){
                          return o.predicate === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && o.subject.startsWith(k)
                      })
                      .map(function(o) {
                          return o.subject
                      })
                  var expressions = bonds.map(function(bond) {
                      var subject = v.filter(function(o) {
                          return o.predicate.endsWith("has-bond") && o.object === bond
                      }).map(function(o) {return o.subject})[0]
                      var predicate = v.filter(function(o) {
                          return o.predicate === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && o.subject === bond
                      }).map(function(o) {return o.object})[0]
                      var object = v.filter(function(o) {
                          return o.predicate.endsWith("bond-with") && o.subject === bond
                      }).map(function(o) {return o.object})[0]
                      return subject.split("\/").slice(-1)[0]+"\n"+predicate+"\n"+object.split("\/").slice(-1)[0]
                  })
                  return expressions.join(";\n")
              })).join("\n\n")
          }
        var description = stringify($(this).data())//attr(field)
        var parent = $(this.parentElement)
        var position = parent.position()
        var tooltip = $('.margintooltip')
        var width = Math.min(options.width || 100, position.left)

        if (width < 60 || !description) {
          return
        }

        tooltip
          .css({
            'border-right': 'solid 2px #FF00FF',
            'font-size': '13px',
            'left': position.left - width - 5,
            'min-height': parent.height(),
            'padding-right': '7px',
            'position': 'absolute',
            'text-align': 'right',
            'top': position.top,
            'width': width
          })
          .text(description)
          .stop()
          .fadeIn({
            duration:100,
            queue: false
          })
      }, function () {
        $('.margintooltip').stop()
        $('.margintooltip').fadeOut({
          duration: 100
        })
      })
    }
}));
