/**
 * @license MPL 1.1/GPL 2.0/LGPL 2.1, see license.txt
 * @author William Elwood <we9@kent.ac.uk>
 * @copyright 2010 JSONovich Team. All Rights Reserved.
 * @description This file contains block-folding functions for the rendered JSON content.
 */

'use strict';

(function() {
    function folder() {
        document.removeEventListener("DOMContentLoaded", folder, false);
        document.removeEventListener("load", folder, false);
        var r_folded = / folded\b/, r_toggled = / toggled\b/, r_class = /[\n\t\r]/g;
        Array.prototype.map.call(document.querySelectorAll(".json"), function(fold) {
            fold.addEventListener("click", toggleFold, false);
        });

        function toggleFold(e) {
            e = e || window.event;
            var t = e.target || e.srcElement;
            while(!(t.nodeName == "SPAN" && (' ' + t.className + ' ').replace(r_class, ' ').indexOf(' line ') > -1)) {
                t = t.parentNode;
            }
            if(!t.hasAttribute("data-fold")) {
                return false;
            }
            var fold = t.getAttribute("data-fold"),
            folded = t.hasAttribute("data-folded"),
            foldLines = t.parentNode.querySelectorAll("[data-fold" + fold + "]")/*,
            foldStart = t.querySelector("code")*/;
            toggle(t, "toggled", r_toggled);
            Array.prototype.map.call(foldLines, helper);
            if(folded) {
                t.removeAttribute("data-folded");/*
                foldStart.removeChild(foldStart.lastChild);*/
            } else {
                t.setAttribute("data-folded", "1");/*
                var end = document.createTextNode(" \2026 " + foldLines.item(foldLines.length-1).textContent.trim());
                foldStart.appendChild(end);*/
            }

            function helper(line) {
                toggle(line, "folded", r_folded);
            }

            function toggle(element, style, regex) {
                if(folded) {
                    element.className = element.className.replace(regex, "");
                } else {
                    element.className += " " + style;
                }
            }
            return false;
        }
    }
    document.addEventListener("DOMContentLoaded", folder, false);
    document.addEventListener("load", folder, false);
})();
