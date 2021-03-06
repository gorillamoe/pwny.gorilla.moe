/*jshint esversion: 6 */
(function(window, document) {
        "use strict";

        var Pwny = function() {
                var self = this,
                        getWidth = function() {
                                return window.innerWidth;
                        },
                        window_min_width = 1000,
                        LOCAL_STORAGE_TEMPLATE_NAME = "codetest_templates",
                        SYNTAXES = [
                                "coffee",
                                "css",
                                "diff",
                                "dockerfile",
                                "html",
                                "javascript",
                                "json",
                                "less",
                                "markdown",
                                "mysql",
                                "php",
                                "sass",
                                "scss",
                                "sh",
                                "sql",
                                "tsx",
                                "typescript",
                                "xml",
                                "yaml"
                        ],
                        EDITOR = null,
                        my_lzma = new window.LZMA("assets/lzma_worker.js");

                this.version = 3;

                this.append = function(element, target) {
                        target = target || document.body;
                        if (typeof target === "string") target = document.querySelector(target);
                        var elementCallback = function(el) {
                                target.appendChild(el);
                        };
                        if (element.length) {
                                element.forEach(elementCallback);
                        } else {
                                target.appendChild(element);
                        }
                };

                this.createElement = function(
                        node_name,
                        node_contents,
                        node_attributes
                ) {
                        var el = document.createElement(node_name);
                        var typeof_contents = typeof node_contents;
                        var attributesCallback = function(attr) {
                                el.setAttribute(attr[0], attr[1]);
                        };
                        if (node_attributes && node_attributes.length) {
                                node_attributes.forEach(attributesCallback);
                        }
                        var contentsCallback = function(content) {
                                el.appendChild(content);
                        };
                        switch (typeof_contents) {
                                case "string":
                                        el.innerHTML = node_contents;
                                        break;
                                case "object":
                                        if (node_contents) {
                                                if (node_contents.length) {
                                                        node_contents.forEach(contentsCallback);
                                                } else {
                                                        el.appendChild(node_contents);
                                                }
                                        }
                                        break;
                                default:
                                        break;
                        }
                        return el;
                };

                this.setupHtml = function() {
                        self.append(
                                self.createElement("img", null, [
                                        ["id", "logo"],
                                        ["src", "pwny.png"]
                                ]),
                                "#app"
                        );
                        self.append(self.createElement("ul"), "#drawer");
                        self.append(self.createElement("input", null, [
                                        ["id", "file"],
                                        ["name", "file"],
                                        ["type", "file"]
                                ]));
                        self.append(
                                [
                                        self.createElement("li", [
                                                self.createElement(
                                                        "button",
                                                        "Run",
                                                        [["id", "btn_run"]]
                                                )
                                        ]),
                                        self.createElement("li", [
                                                self.createElement(
                                                        "select",
                                                        null,
                                                        [["id", "syntax"]]
                                                )
                                        ]),
                                        self.createElement("li", [
                                                self.createElement(
                                                        "button",
                                                        "Open File",
                                                        [["id", "btn_file"]]
                                                )
                                        ]),
                                        self.createElement("li", [
                                                self.createElement(
                                                        "button",
                                                        "Add Template",
                                                        [["id", "btn_add"]]
                                                )
                                        ]),
                                        self.createElement("li", [
                                                self.createElement(
                                                        "select",
                                                        null,
                                                        [["id", "templates"]]
                                                )
                                        ]),
                                        self.createElement("li", [
                                                self.createElement(
                                                        "button",
                                                        "Delete Template",
                                                        [["id", "btn_delete"]]
                                                )
                                        ]),
                                        self.createElement("li", [
                                                self.createElement(
                                                        "button",
                                                        "Share",
                                                        [["id", "btn_share"]]
                                                )
                                        ])
                                ],
                                "#drawer ul"
                        );
                        self.append(
                                self.createElement("div", null, [
                                        ["id", "table"],
                                        ["class", "container"]
                                ]),
                                "#app"
                        );
                        self.append(
                                self.createElement("div", null, [
                                        ["id", "table-row"],
                                        ["class", "row"]
                                ]),
                                "#table"
                        );
                        self.append(
                                [
                                        self.createElement("div", null, [
                                                ["id", "col1"],
                                                ["class", "col-sm-6"]
                                        ]),
                                        self.createElement("div", null, [
                                                ["id", "col2"],
                                                ["class", "col-sm-6"]
                                        ])
                                ],
                                "#table-row"
                        );
                        self.append(
                                self.createElement("textarea", null, [
                                        ["id", "textarea"]
                                ]),
                                "#col1"
                        );
                        self.append(
                                [
                                        self.createElement("iframe", null, [
                                                ["id", "output"],
                                                ["name", "output"]
                                        ])
                                ],
                                "#col2"
                        );
                };

                this.compression = {
                        convertToFormatedHex: function(byte_arr) {
                                var hex_str = "",
                                        i,
                                        len,
                                        tmp_hex;
                                if (!self.isArray(byte_arr)) {
                                        return false;
                                }
                                len = byte_arr.length;
                                for (i = 0; i < len; i++) {
                                        if (i !== 0) tmp_hex += " ";
                                        if (byte_arr[i] < 0) {
                                                byte_arr[i] = byte_arr[i] + 256;
                                        }
                                        tmp_hex = byte_arr[i].toString(16);
                                        // Add leading zero.
                                        if (tmp_hex.length === 1) {
                                                tmp_hex = "0" + tmp_hex;
                                        }
                                        hex_str += tmp_hex;
                                }
                                return hex_str;
                        },
                        compress: function(data, cb) {
                                my_lzma.compress(data, 9, function(result) {
                                        cb(
                                                false,
                                                self.compression.convertToFormatedHex(result)
                                        );
                                });
                        },
                        decompress: function(data, cb) {
                                var byte_arr = self.compression.convertFormatedHexToBytes(data);
                                my_lzma.decompress(byte_arr, function(result) {
                                        if (result === false) cb(true, []);
                                        else cb(false, result);
                                });
                        },
                        convertFormatedHexToBytes: function(hex_str) {
                                var count = 0,
                                        hex_arr,
                                        hex_data = [],
                                        hex_len,
                                        i;
                                if (hex_str.trim() === "") {
                                        return [];
                                }
                                // Check for invalid hex characters.
                                if ((/[^0-9a-fA-F]/).test(hex_str)) {
                                        return false;
                                }
                                hex_arr = hex_str.match(/.{2}/g);
                                hex_len = hex_arr.length;
                                for (i = 0; i < hex_len; i++) {
                                        if (hex_arr[i].trim() === "") {
                                                continue;
                                        }
                                        hex_data[count++] = parseInt(
                                                hex_arr[i],
                                                16
                                        );
                                }
                                return hex_data;
                        },
                        prepareData: function(str) {
                                var arr;
                                // If the string is a JSON array, use that. This allows us to compress a byte array.
                                if (str[0] === "[" && str.slice(-1) === "]") {
                                        try {
                                                arr = JSON.parse(str);
                                        } catch (e) {}
                                }
                                if (arr) {
                                        return arr;
                                }
                                return str;
                        }
                };

                this.getEditorSyntax = function() {
                        var mode_id = EDITOR.getSession().$modeId;
                        var syntax = mode_id.split("/")[2];
                        return syntax;
                };

                this.setEditorSyntax = function(syntax) {
                        if (this.isAllowedSyntax(syntax) === true) {
                                EDITOR.getSession().setMode("ace/mode/" + syntax);
                                var synsel_children = document.querySelectorAll("#syntax option");
                                var cb = function(el) {
                                        if (el.innerHTML === syntax) {
                                                el.selected = true;
                                                return true;
                                        }
                                };
                                synsel_children.forEach(cb);
                                this.showAndHideRun();
                        }
                };

                this.addDomReadyEvent = function(cb) {
                        if (document.readyState === "complete") {
                                return window.setTimeout(cb, 1);
                        } else {
                                document.addEventListener(
                                        "DOMContentLoaded",
                                        function() {
                                                cb();
                                        }
                                );
                        }
                };

                this.isAllowedSyntax = function(syntax) {
                        return SYNTAXES.includes(syntax);
                };

                this.autoRun = function() {
                        this.showAndHideOutput();
                        window.mockhtml();
                        var app = document.querySelector("#app");
                        var logo = document.querySelector("#logo");
                        var col1 = document.querySelector("#col1");
                        var col2 = document.querySelector("#col2");
                        var $ = window.$;
                        var drawertoggle = document.querySelector("#drawer-toggle");
                        var drawerlabel = document.querySelector("#drawer-toggle-label");
                        var drawer = document.querySelector("#drawer");
                        var ifr = document.querySelector("#output");
                        logo.parentNode.removeChild(logo);
                        drawer.parentNode.removeChild(drawer);
                        drawerlabel.parentNode.removeChild(drawerlabel);
                        drawertoggle.parentNode.removeChild(drawertoggle);
                        app.style.margin = "0";
                        app.style.padding = "0";
                        col2.style.display = "block";
                        col2.style.width = "100%";
                        col1.parentNode.removeChild(col1);
                        $(ifr).addClass("fullscreen");
                        $(col2).removeClass("col-sm-6");
                        $("#table").addClass("fullscreen");
                };

                this.loadFromHash = function() {
                        var hash = window.location.hash,
                                loc = hash.indexOf("#!/"),
                                virtual_url = "",
                                url_params = null,
                                syntax = "html",
                                shared_code = "";
                        if (loc === 0 && hash.length > 3) {
                                virtual_url = hash.substring(3);
                                url_params = self.getUrlParams(virtual_url);
                                try {
                                        shared_code = url_params.get("t");
                                        syntax = url_params.get("s");
                                        if (
                                                self.isAllowedSyntax(syntax) ===
                                                true
                                        ) {
                                                self.setEditorSyntax(syntax);
                                        }
                                        self.compression.decompress(
                                                shared_code,
                                                function(err, result) {
                                                        if (!err) {
                                                                EDITOR.setValue(result);
                                                                EDITOR.resize(true);
                                                                var title = url_params.get("title");
                                                                if (title) {
                                                                        document.title = decodeURIComponent(title);
                                                                }
                                                                var line = url_params.get("l");
                                                                if (line) {
                                                                        var column =
                                                                                url_params.get("c") ||
                                                                                0;

                                                                        setTimeout(
                                                                                function() {
                                                                                        EDITOR.scrollToLine(
                                                                                                line,
                                                                                                true,
                                                                                                true,
                                                                                                function() {}
                                                                                        );
                                                                                        EDITOR.gotoLine(
                                                                                                line,
                                                                                                column,
                                                                                                true
                                                                                        );
                                                                                        EDITOR.focus();
                                                                                },
                                                                                2000
                                                                        );
                                                                }
                                                                if (
                                                                        url_params.get("a") ===
                                                                        "1"
                                                                ) {
                                                                        self.hideLoading();
                                                                        self.autoRun();
                                                                        return;
                                                                }
                                                        } else {
                                                                window.alert("No valid token received");
                                                        }
                                                        self.hideLoading();
                                                }
                                        );
                                } catch (ex) {
                                        window.console.log(ex);
                                        window.alert("No valid token received");
                                        self.hideLoading();
                                }
                        } else {
                                self.hideLoading();
                        }
                };

                this.showLoading = function() {
                        document.querySelector("#app").style.display = "none";
                        window.$("#loading").css({display: "block"});
                        window.$("#drawer-toggle-label").css({
                                display: "none"
                        });
                };

                this.hideLoading = function() {
                        window.$("#loading").fadeOut("slow", function() {
                                window.$("#drawer-toggle-label").fadeIn("slow");
                                window.$("#app").fadeIn("slow");
                        });
                };

                this.deleteTemplate = function() {
                        var templates =
                                window.localStorage.getItem(LOCAL_STORAGE_TEMPLATE_NAME) || "{}";
                        templates = JSON.parse(templates);
                        var tplsel = document.getElementById("templates");
                        var index = tplsel.selectedIndex;
                        var opt = tplsel.children[index];
                        if (
                                opt.value &&
                                opt.value.length &&
                                templates[opt.value]
                        ) {
                                delete templates[opt.value];
                                window.localStorage.setItem(
                                        LOCAL_STORAGE_TEMPLATE_NAME,
                                        JSON.stringify(templates)
                                );
                                self.fillTemplates();
                        }
                };

                this.fillTemplates = function() {
                        var templates =
                                window.localStorage.getItem(LOCAL_STORAGE_TEMPLATE_NAME) || "{}";
                        templates = JSON.parse(templates);
                        var tplsel = document.getElementById("templates");
                        tplsel.innerHTML =
                                '<option value="">-- Templates --</option>';
                        for (var tpl_name in templates) {
                                var opt = document.createElement("option");
                                opt.innerHTML = tpl_name;
                                opt.value = tpl_name;
                                tplsel.appendChild(opt);
                        }
                };

                this.isCompilable = function() {
                        var comp = ["html", "javascript", "markdown", "scss"];
                        var current_syntax = this.getEditorSyntax();
                        return comp.includes(current_syntax);
                };

                this.showAndHideOutput = function() {
                        var is_compilable = self.isCompilable();
                        if (is_compilable === false) {
                                window.$("#col1").removeClass("col-sm-6");
                                window.$("#col1").addClass("col-sm-12");
                                window.$("#col2").addClass("hidden");
                        } else {
                                window.$("#col1").addClass("col-sm-6");
                                window.$("#col1").removeClass("col-sm-12");
                                window.$("#col2").removeClass("hidden");
                        }
                };

                this.showAndHideRun = function() {
                        var is_compilable = self.isCompilable();
                        window.$("#col1").removeClass("col-sm-6");
                        window.$("#col1").addClass("col-sm-12");
                        window.$("#col2").addClass("hidden");
                        if (is_compilable === false) {
                                window.$("#btn_run").get(0).style.display =
                                        "none";
                        } else {
                                window.$("#btn_run").get(0).style.display =
                                        "inline-block";
                        }
                };

                this.fillSyntax = function() {
                        var synsel = document.getElementById("syntax");
                        var current_syntax = self.getEditorSyntax();
                        var _filla = function(tpl_name) {
                                var opt = document.createElement("option");
                                if (current_syntax === tpl_name) {
                                        opt.selected = true;
                                }
                                opt.innerHTML = tpl_name;
                                opt.value = tpl_name;
                                synsel.appendChild(opt);
                        };
                        SYNTAXES.forEach(_filla);
                        self.showAndHideRun();
                };

                this.getUrlParams = function(url) {
                        var link = document.createElement("a");
                        link.href = url;
                        var link_search = link.search;
                        var params = new Map();
                        var arrCb = function(param) {
                                var spl = param.split("=");
                                params.set(spl[0], spl[1]);
                        };
                        if (link_search && link_search.length) {
                                link_search = link_search.substring(1);
                                var arr = link_search.split("&");
                                arr.forEach(arrCb);
                        }
                        return params;
                };

                this.isArray = function(input) {
                        return (
                                input &&
                                typeof input === "object" &&
                                (input instanceof Array ||
                                        (input.buffer &&
                                                input.buffer instanceof
                                                        ArrayBuffer))
                        );
                };

                this.showShareWindow = function(link) {
                        var $shareDialogue = window.$("#shareDialogue");
                        var shareUrlBox = $shareDialogue.find("#shareUrlBox");
                        shareUrlBox.val(link);
                        $shareDialogue.modal("toggle");
                };

                this.init = function() {
                        self.showLoading();
                        new window.Clipboard("#copyShareUrlButton");
                        self.setupHtml();
                        document.getElementById("templates").onchange = function() {
                                var templates =
                                        window.localStorage.getItem(LOCAL_STORAGE_TEMPLATE_NAME) || "{}";
                                templates = JSON.parse(templates);
                                var index = this.selectedIndex;
                                var opt = this.children[index];
                                if (
                                        opt.value &&
                                        opt.value.length &&
                                        templates[opt.value]
                                ) {
                                        EDITOR.setValue(templates[opt.value].src);
                                        self.setEditorSyntax(templates[opt.value].syntax);
                                }
                        };

                        self.fillTemplates();

                        window.$("#btn_run").get(0).onclick = function(evt) {
                                evt.preventDefault();
                                self.showAndHideOutput();
                                window.mockhtml();
                        };

                        window.$("#btn_add").get(0).onclick = function(evt) {
                                evt.preventDefault();
                                var tpl_name = window.prompt(
                                        "Save as template? Enter a name for the template",
                                        ""
                                );
                                if (tpl_name !== null && tpl_name.length) {
                                        var tpls =
                                                window.localStorage.getItem(LOCAL_STORAGE_TEMPLATE_NAME) || "{}";
                                        tpls = JSON.parse(tpls);
                                        tpls[tpl_name] = {
                                                src: EDITOR.getValue(),
                                                syntax: self.getEditorSyntax()
                                        };
                                        window.localStorage.setItem(
                                                LOCAL_STORAGE_TEMPLATE_NAME,
                                                JSON.stringify(tpls)
                                        );
                                        self.fillTemplates();
                                }
                        };

                        window.$("#btn_delete").get(0).onclick = function(evt) {
                                evt.preventDefault();
                                self.deleteTemplate();
                        };

                        var getShareableLink = (opts, cb) => {
                                opts = opts || {};
                                var syntax = self.getEditorSyntax();
                                var cursorPosition = EDITOR.getCursorPosition();
                                var max_link_length = 8000;
                                var port =
                                        window.location.port === ""
                                                ? 80
                                                : parseInt(
                                                          window.location.port,
                                                          10
                                                  );
                                if (port === 80 || port === 443) {
                                        port = "";
                                } else {
                                        port = ":" + port;
                                }
                                var title = window.$("#shareUrlTitle").val();
                                var fullscreen = window.
                                        $("#shareUrlFullscreen").
                                        is(":checked");
                                if (title.length) {
                                        title =
                                                "&title=" +
                                                encodeURIComponent(title);
                                }
                                if (fullscreen) {
                                        fullscreen = "&a=1";
                                } else {
                                        fullscreen = "";
                                }
                                self.compression.compress(
                                        EDITOR.getValue(),
                                        function(err, result) {
                                                var link =
                                                        window.location.
                                                                protocol +
                                                        "//" +
                                                        window.location.
                                                                hostname +
                                                        port +
                                                        "/#!/?s=" +
                                                        syntax +
                                                        title +
                                                        fullscreen +
                                                        "&c=" +
                                                        cursorPosition.column +
                                                        "&l=" +
                                                        (cursorPosition.row +
                                                                1) +
                                                        "&t=" +
                                                        result.toString();
                                                // http://stackoverflow.com/questions/15090220/maximum-length-for-url-in-chrome-browser
                                                // var max_link_length = 2083;
                                                // not giving a fuck about other browsers than chrome
                                                if (
                                                        link.length >
                                                        max_link_length
                                                ) {
                                                        cb(
                                                                "Too much code to share :( Try reducing your code and try again!",
                                                                link
                                                        );
                                                } else {
                                                        cb(false, link);
                                                }
                                        }
                                );
                        };

                        var getShareableLinkCallback = (err, link) => {
                                if (err === false) {
                                        self.showShareWindow(link);
                                } else {
                                        alert(err);
                                }
                        };

                        window.$("#btn_share").get(0).onclick = function(evt) {
                                evt.preventDefault();
                                getShareableLink({}, getShareableLinkCallback);
                        };

                        window.mockhtml = function() {
                                var ifr = document.getElementById("output");
                                var form = document.createElement("form");
                                form.style.visibility = "hidden";
                                form.method = "POST";
                                form.target = "output";
                                form.action = "output.php";
                                var inputSyntax = document.createElement("input");
                                inputSyntax.name = "syntax";
                                inputSyntax.type = "hidden";
                                inputSyntax.value = self.getEditorSyntax();
                                var inputInput = document.createElement("input");
                                inputInput.name = "input";
                                inputInput.type = "hidden";
                                inputInput.value = EDITOR.getValue();
                                form.appendChild(inputSyntax);
                                form.appendChild(inputInput);
                                document.body.appendChild(form);
                                ifr.onload = function() {
                                        form.parentNode.removeChild(form);
                                };
                                form.submit();
                                return false;
                        };

                        window.ace.require("ace/ext/language_tools");
                        EDITOR = window.ace.edit("textarea");
                        EDITOR.setTheme("ace/theme/tomorrow_night_eighties");

                        EDITOR.getSession().setMode("ace/mode/html");
                        EDITOR.$blockScrolling = Infinity;
                        EDITOR.setOptions({
                                fontFamily: "Source Code Pro",
                                fontSize: "10pt",
                                enableBasicAutocompletion: true,
                                enableSnippets: true,
                                enableLiveAutocompletion: false,
                                tabSize: 8,
                                useSoftTabs: true
                        });

                        self.fillSyntax();

                        document.getElementById("syntax").onchange = function() {
                                var sel_index = this.selectedIndex,
                                        sel_item = this.children[sel_index];
                                self.setEditorSyntax(sel_item.innerHTML);
                        };

                        document.addEventListener("keydown", function(evt) {
                                if (
                                        getWidth() <= window_min_width &&
                                        evt.key === "Escape"
                                ) {
                                        window.$("#col1").get(0).style.display =
                                                "block";
                                        window.$("#col2").get(0).style.display =
                                                "none";
                                        EDITOR.focus();
                                } else if (
                                        evt.ctrlKey === true &&
                                        evt.key === "Enter"
                                ) {
                                        if (self.isCompilable() === true) window.mockhtml();
                                }
                        });
                        var loadFromFile = function(evt) {
                                var files = evt.target.files; // FileList object
                                var fr = new FileReader();
                                fr.onload = function(e) {
                                        EDITOR.setValue(e.target.result);
                                };
                                if (files && files.length) {
                                        fr.readAsText(files[0]);
                                }
                        };
                        document.getElementById("file").addEventListener(
                                "change",
                                loadFromFile,
                                false
                        );
                        window.$("#btn_file").get(0).onclick = function() {
                                document.getElementById("file").click();
                        };
                        window.$("#shareDialogue").on(
                                "hidden.bs.modal",
                                function() {
                                        window.$("#shareUrlFullscreen").prop(
                                                "checked",
                                                false
                                        );
                                }
                        );
                        window.$("#shareUrlFullscreen").on(
                                "change",
                                function() {
                                        getShareableLink({}, function(
                                                err,
                                                link
                                        ) {
                                                if (err === false) {
                                                        window.$("#shareUrlBox").val(link);
                                                }
                                        });
                                }
                        );
                        window.$("#shareUrlTitle").on("keyup", function() {
                                getShareableLink({}, function(err, link) {
                                        if (err === false) {
                                                window.$("#shareUrlBox").val(link);
                                        }
                                });
                        });
                        window.$(window).on("hashchange", function() {
                                window.location.reload();
                        });
                        window.$("#drawer-toggle-label").on(
                                "click",
                                function() {
                                        window.setTimeout(function() {
                                                EDITOR.resize();
                                        }, 1);
                                }
                        );
                        self.loadFromHash();
                };

                return this;
        };

        var pwny = new Pwny();
        pwny.addDomReadyEvent(pwny.init);
})(window, document);
