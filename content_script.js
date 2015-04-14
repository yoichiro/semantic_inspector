var ItemPropValues = function() {
    this.initialize();
};

ItemPropValues.prototype = {
    sources: [
        [["meta"], "content"],
        [["audio", "embed", "iframe", "img", "source", "track", "video"], "src"],
        [["a", "area", "link"], "href"],
        [["object"], "data"],
        [["time"], "datetime"]
    ],
    initialize: function() {
        this.values = {};
        for (var i = 0; i < this.sources.length; i++) {
            var tags = this.sources[i][0];
            var attribute = this.sources[i][1];
            for (var j = 0; j < tags.length; j++) {
                this.values[tags[j]] = attribute;
            }
        }
    },
    getAttributeName: function(tagName) {
        return this.values[tagName];
    }
};

var CS = function() {
    this.initialize();
};

CS.prototype = {
    initialize: function() {
        this.itemPropValues = new ItemPropValues();
    },
    start: function() {
        this.traversedElements = new Array();
        var root = document.documentElement;
        var items = new Array();
        this.traverseDomElements(root, items, null);
        this.sendMessage(items);
    },
    traverseDomElements: function(element, items, currentItem) {
        if (!this.checkDoneElement(element)) {
            currentItem = this.processElement(element, items, currentItem);
            if (element.hasChildNodes()) {
                var children = element.childNodes;
                for (var i = 0; i < children.length; i++) {
                    if (children[i].nodeType == 1) {
                        this.traverseDomElements(children[i], items, currentItem);
                    }
                }
            }
        }
    },
    processElement: function(element, items, currentItem) {
        var attributes = this.retrieveHtmlMicrodataAttributes(element);
        var itemScope = attributes["itemscope"];
        var itemProp = attributes["itemprop"];
        var itemPropReverse = attributes["itemprop-reverse"];
        var itemType = attributes["itemtype"];
        var itemRef = attributes["itemref"];
        var itemId = attributes["itemid"];
        var newItem = null;
        if (itemScope) {
            newItem = this.createItem();
            if (itemId) {
                newItem.id = itemId.nodeValue;
            }
            if (itemType) {
                newItem.type = itemType.nodeValue;
            }
        }
        if (itemProp) {
            this.addItemProperty(itemProp, itemScope, currentItem,
                                 newItem, element, this.addPropertyValue);
        } else if (itemPropReverse) {
            this.addItemProperty(itemPropReverse, itemScope, currentItem,
                                 newItem, element, this.addPropertyReverseValue);
        } else {
            if (itemScope) {
                items.push(newItem);
                currentItem = newItem;
            }
        }
        if (itemRef) {
            var refs = itemRef.nodeValue.split(" ");
            for (var i = 0; i < refs.length; i++) {
                var targetElement = document.getElementById(refs[i]);
                if (targetElement) {
                    this.traverseDomElements(targetElement, items, currentItem);
                }
            }
        }
        return currentItem;
    },
    addItemProperty: function(itemProp, itemScope, currentItem, newItem, element, addFunc) {
        var itemPropValues = itemProp.nodeValue.split(" ");
        for (var i = 0; i < itemPropValues.length; i++) {
            var itemPropValue = itemPropValues[i];
            if (itemScope) {
                if (currentItem) {
                    addFunc(currentItem, itemPropValue, newItem);
                    currentItem = newItem;
                } else {
                    // should throw exception
                    console.log("should throw exception - 2");
                }
            } else {
                if (currentItem) {
                    var tagName = element.tagName.toLowerCase();
                    var attributeName =
                            this.itemPropValues.getAttributeName(tagName);
                    if (attributeName) {
                        addFunc(currentItem, itemPropValue,
                                element.getAttribute(attributeName));
                    } else {
                        var text = this.getElementText(element, "");
                        addFunc(currentItem, itemPropValue, text);
                    }
                } else {
                    // should throw exception
                    console.log("should throw exception - 3");
                }
            }
        }
    },
    retrieveHtmlMicrodataAttributes: function(element) {
        var result = {};
        var attributes = element.attributes;
        for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes[i];
            var name = attribute.nodeName;
            if (name == "itemscope"
                || name == "itemprop"
                || name == "itemprop-reverse"
                || name == "itemtype"
                || name == "itemref"
                || name == "itemid") {
                result[name] = attribute;
            }
        }
        return result;
    },
    createItem: function() {
        return {
            id: null,
            type: null,
            properties: {},
            reverses: {}
        };
    },
    getElementText: function(element, result) {
        var children = element.childNodes;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.nodeType == 3) {
                result += child.nodeValue;
            } else if (child.nodeType == 1) {
                result = this.getElementText(child, result);
            }
        }
        return result;
    },
    addPropertyValue: function(item, name, value) {
        var values = item.properties[name];
        if (!values) {
            values = new Array();
        }
        values.push(value);
        item.properties[name] = values;
    },
    addPropertyReverseValue: function(item, name, value) {
        var values = item.reverses[name];
        if (!values) {
            values = new Array();
        }
        values.push(value);
        item.reverses[name] = values;
    },
    checkDoneElement: function(element) {
        for (var i = 0; i < this.traversedElements.length; i++) {
            if (this.traversedElements[i] == element) {
                return true;
            }
        }
        this.traversedElements.push(element);
        return false;
    },
    sendMessage: function(items) {
        var message = {items: items};
        chrome.extension.sendRequest(message);
    }
};

var cs = new CS();
cs.start();
