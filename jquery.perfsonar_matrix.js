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
            src: "http://soichi6.grid.iu.edu/vopfmatrix/matrix?id=580" //just an example..
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
                        //html += this.render_result(json, cell_forward, "<i class=\"icon-arrow-right\"/>");
                        html += this.render_result(json, cell_forward, "");
                        //var cell_back = json.matrix[rid][cid][1];//TODO right order?
                        //html += this.render_result(json, cell_back, "<i class=\"icon-arrow-left\"/>");
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
                $(".label").popover("hide");
                $(this).popover("toggle");
            });
        },

        render_result: function(json, cell, icon) {

            //popover titl
            var title = json.statusLabels[cell.result.status];
            //title += cell.type
            //title += " from " + cell.parameters.source + " to " + cell.parameters.destination;
            title += "<button type='button' class='close' onclick='$(&quot;.label&quot;).popover(&quot;hide&quot;);'>&times;</button>";

            //figure what to put in front label
            var label_status = "inverse"; //unknown
            var status = json.statusLabels[cell.result.status];
            switch(cell.result.status) {
            case 0: label_status = "success"; status = "OK"; break;
            case 1: label_status = "warning"; status = "Warning"; break;
            case 2: 
            case 3: 
            case 4: 
                status = "Error";
                label_status = "important";break;
            }

            //construct information to display in popover
            var popover = "";
            //popover += "<h4>"+json.statusLabels[cell.result.status]+"</h4><p>"+cell.result.message+"</p><br>";
            popover += "<pre>";
            popover += cell.result.message;
            popover += "</pre>";
            popover += "<time class='pull-right'>"+cell.result.time+"</time>";
            popover += "<table class='table table-condensed'>";
            for(var pkey in cell.parameters) {
                var pvalue = cell.parameters[pkey];
                popover += "<tr><th>"+pkey+"</th><td>"+pvalue+"</td></tr>";
            }
            popover += "</table>";

            //put everything together
            var html = "<p><span data-title=\""+title+"\" data-content=\""+popover+"\" "+
                "class=\"label label-"+label_status+"\">"+icon+" "+status+"</span></p>";
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
