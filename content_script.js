var CS = function() {
    this.initialize();
};

CS.prototype = {
    initialize: function() {
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
        var itemType = attributes["itemtype"];
        var itemRef = attributes["itemref"];
        var newItem = null;
        if (itemScope) {
            newItem = this.createItem();
            if (itemType) {
                newItem.type = itemType.nodeValue;
            } else {
                // should throw exception
                console.log("should throw exception - 1");
            }
        }
        if (itemProp) {
            var itemPropValues = itemProp.nodeValue.split(" ");
            for (var i = 0; i < itemPropValues.length; i++) {
                var itemPropValue = itemPropValues[i];
                if (itemScope) {
                    if (currentItem) {
                        this.addPropertyValue(currentItem, itemPropValue, newItem);
                        currentItem = newItem;
                    } else {
                        // should throw exception
                        console.log("should throw exception - 2");
                    }
                } else {
                    if (currentItem) {
                        var tagName = element.tagName.toLowerCase();
                        if (tagName == "a" || tagName == "link") {
                            this.addPropertyValue(currentItem, itemPropValue,
                                                  element.getAttribute("href"));
                        } else if (tagName == "img") {
                            this.addPropertyValue(currentItem, itemPropValue,
                                                  element.getAttribute("src"));
                        } else if (tagName == "meta") {
                            this.addPropertyValue(currentItem, itemPropValue,
                                                  element.getAttribute("content"));
                        } else {
                            var text = this.getElementText(element, "");
                            this.addPropertyValue(currentItem, itemPropValue, text);
                        }
                    } else {
                        // should throw exception
                        console.log("should throw exception - 3");
                    }
                }
            }
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
    retrieveHtmlMicrodataAttributes: function(element) {
        var result = {};
        var attributes = element.attributes;
        for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes[i];
            var name = attribute.nodeName;
            if (name == "itemscope"
                || name == "itemprop"
                || name == "itemtype"
                || name == "itemref") {
                result[name] = attribute;
            }
        }
        return result;
    },
    createItem: function() {
        return {
            type: null,
            properties: {}
        };
    },
    getElementText: function(element, result) {
        var children = element.childNodes;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.nodeType == 3) {
                result += child.nodeValue;
            } else if (child.nodeType = 1) {
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