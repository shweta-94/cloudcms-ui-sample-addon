define(function(require, exports, module) {

    var Ratchet = require("ratchet/ratchet");
    var Actions = require("ratchet/actions");
    var $ = require("jquery");
    var OneTeam = require("oneteam");

    return Ratchet.Actions.register("new_folder", Ratchet.AbstractAction.extend({

        defaultConfiguration: function()
        {
            var config = this.base();

            config.title = "New Folder";
            config.iconClass = "glyphicon glyphicon-plus";

            return config;
        },

        execute: function(config, actionContext, callback)
        {
            var self = this;

            OneTeam.project2ContentTypes(actionContext, false, function(contentTypeEntries) {

                actionContext.model.typeEnum = [];
                actionContext.model.typeOptionLabels = [];

                for (var i = 0; i < contentTypeEntries.length; i++) {
                    actionContext.model.typeEnum.push(contentTypeEntries[i].qname);
                    actionContext.model.typeOptionLabels.push(contentTypeEntries[i].title);
                }

                self.doAction(actionContext, function (err, result) {
                    callback(err, result);
                });
            });
        },

        doAction: function(actionContext, callback)
        {
            var self = this;

            // modal dialog
            Ratchet.fadeModal({
                "title": "New Folder",
                "cancel": true
            }, function(div, renderCallback) {

                // append the "Create" button
                $(div).find('.modal-footer').append("<button class='btn btn-primary pull-right create'>Create</button>");

                // body
                $(div).find(".modal-body").html("");
                $(div).find(".modal-body").append("<div class='form'></div>");

                // form definition
                var c = {
                    "data": {
                    },
                    "schema": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "type": "string",
                                "required": true
                            },
                            "type": {
                                "type": "string",
                                "enum": actionContext.model.typeEnum,
                                "default": "n:node",
                                "required": true
                            },
                            "description": {
                                "type": "string"
                            }
                        }
                    },
                    "options": {
                        "fields": {
                            "title": {
                                "type": "text",
                                "label": "Title"
                            },
                            "type": {
                                "type": "select",
                                "label": "Folder Type",
                                "optionLabels": actionContext.model.typeOptionLabels,
                                "removeDefaultNone": true
                            },
                            "description": {
                                "type": "textarea",
                                "label": "Description"
                            }
                        }
                    }
                };

                c.postRender = function(control)
                {
                    OneTeam.bindFormChildEnterClick(control, $(div).find(".create"));

                    // create button
                    $(div).find('.create').off().click(function(e) {

                        e.preventDefault();

                        OneTeam.processFormAction(control, div, function(value) {
                            self.createFolder(value.title, value.description, value.type, actionContext, callback);
                        });

                    });

                    OneTeam.bindTextFields(control, function() {
                        $(div).find(".create").click();
                    });

                    renderCallback(function() {
                        // TODO: anything?
                    });
                };

                var _form = $(div).find(".form");
                OneTeam.formCreate(_form, c);
            });
        },

        createFolder: function(title, description, typeQName, actionContext, callback)
        {
            var obj = {};
            if (title) {
                obj.title = title;
            }
            if (description) {
                obj.description = description;
            }

            obj._features = {
                "f:container": {
                    "active": true
                }
            };

            obj._type = "n:node";
            if (typeQName) {
                obj._type = typeQName;
            }

            var options = {
                "rootNodeId": "root",
                "parentFolderPath": actionContext.model.path,
                "associationType": "a:child"
            };

            OneTeam.projectBranch(actionContext, function() {

                // NOTE: this = branch
                this.createNode(obj, options).then(function() {
                    callback();
                });
            });

        }

    }));
});

