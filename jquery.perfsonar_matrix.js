// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = "perfsonar_matrix",
        defaults = {
            src: "http://soichi6.grid.iu.edu/myosg/vopfmatrix/matrix?id=627" //just an example..
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {
        init: function() {
            var that = this;
            $.getJSON(this.options.src)
            .done(function(json) {
                that.render.call(that, json);
            })
            .fail(function(jqxhr, textStatus, error) {
                alert("failed to load perfsonar json from " + that.options.src);
            });
        },

        render: function(json) {
            //$(this.element).css("background-color", "red");

            var html = "<div class=\"pf-m\">";
            html += "<table class=\"table table-condensed\">";
            
            //column header
            html += "<thead>";
            html += "<tr>";
            html += "<th class=\"pf-m-name\">"+$(this.element).data("name")+"</th>";
            for (var cid in json.columns) {
                var column = json.columns[cid];
                html += "<th class=\"pf-m-colhead\">";
                html += "<div class=\"pf-m-colhead-text\">"+column.hostname+"</div>";
                html += "</th>";
            }
            html += "<th class=\"pf-m-colhead-buffer\"></th>";
            html += "</tr>";
            html += "</thead>";

            //matrix
            for (var rid in json.rows) {
                html += "<tr>";
                var row = json.rows[rid];
                html += "<th class=\"pf-m-rowhead\">"+row.hostname+"</th>";
                for (var cid in json.columns) {
                    //var column = json.columns[cid];
                    if(json.matrix[rid][cid][0].result != undefined) {
                        html += "<td>";
                        var cell_forward = json.matrix[rid][cid][0];//TODO right order?
                        html += this.render_result(json, cell_forward);
                        html += "</td>";
                    } else {
                        html += "<td></td>";
                    }
                }
                html += "<th class=\"pf-m-colhead-buffer\"></th>";
                html += "</tr>";
            }

            html += "</table>";
            html += "</div>";
            $(this.element).html(html);
            $(this.element).find(".label").popover({
                html: true,
                placement: "right",
                trigger: "manual"
            });
            $(this.element).find(".label").click(function() {
                $(".popover").hide();
                $(this).popover("toggle");
            });
        },

        render_result: function(json, cell) {

            var title = json.statusLabels[cell.result.status];
            //title += "<button type='button' class='close' onclick='$(&quot;.label&quot;).popover(&quot;hide&quot;);'>&times;</button>";

            //figure what to put in front label
            var label_status = "inverse"; //unknown
            var label = cell.result.parameters.average;
            if(label != undefined) {
                //var num = label.substr(0,label.length-4);
                var num = label.replace(/[a-zA-Z]/g, '');
                var unit = label.replace(/[\.0-9]/g,'');
                label = Math.round(num*10)/10 + " " +unit;
            }
            
            switch(cell.result.status) {
            case 0: label_status = "success"; break;
            case 1: label_status = "warning"; break;
            case 2: 
            case 3: 
                label = "Error";
                label_status = "important";break;
                break;
            case 4: 
                label = "Timeout";
                label_status = "inverse";break;
                break;
            }

            //construct information to display in popover
            var popover = "<div id=\"pf-"+cell.id+"\" class=\"modal hide fade\" data-backdrop=\"false\">";
            popover += "<div class=\"modal-header\">";
            popover += "<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>";
            popover += "<h3 class=\"modal-title\">";
            //show source / dest
            popover += "<p class='pf-m-sourcedest'>";
            popover += "<b>"+cell.parameters.source+"</b>";
            popover += "<span> <i class='icon-arrow-right'/> </span>";
            popover += "<b>"+cell.parameters.destination+"</b>";
            popover += "</p>";
            popover += "</h3>"; //modal-title
            popover += "</div>";//modal-header

            popover += "<div class=\"modal-body\">";
            popover += "<p><span class=\"label label-"+label_status+"\">"+label+"</span> ";
            popover += title+"</p>";
            popover += "<pre>";
            popover += cell.result.message;
            popover += "</pre>";
            popover += "<time class='pull-right'>"+cell.result.time+"</time><br clear='both'>";

            //show result
            popover += "<table class='table table-condensed'>";
            if(cell.result.parameters.average) {
                popover += "<table class='table table-condensed'>";
                for(var pkey in cell.result.parameters) {
                    var pvalue = cell.result.parameters[pkey];
                    popover += "<tr><th>"+pkey+"</th><td>"+pvalue+"</td></tr>";
                }
            } else {
                //show parameters
                for(var pkey in cell.parameters) {
                    var pvalue = cell.parameters[pkey];
                    popover += "<tr><th>"+pkey+"</th><td>"+pvalue+"</td></tr>";
                }
            }
            popover += "</table>";

            popover += "</div>";//modal-body
            popover += "</div>";//modal

            //put everything together
            var html = "<p><a href=\"#pf-"+cell.id+"\" class=\"label label-"+label_status+"\" data-toggle=\"modal\">"+label+"</a></p>";
            html += popover;
            return html; 
        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };

})( jQuery, window, document );
