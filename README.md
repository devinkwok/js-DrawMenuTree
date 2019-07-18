DrawMenuTree
============

A simple tree drawing algorithm in javascript for turning a menu in an HTML document into a tree diagram. This was used to create my homepage at [devinkwok.com](www.devinkwok.com).

How to use
==========
Setup is similar to the example in the repository. The website needs to include the following files:

 + `drawmenutree.js`
 + CSS in `/include/style.css`
 + images from `/include/*`, which are used to draw the lines of the graph

The HTML file should be organized with the menu in nested `divs` with the appropriate `id` and `class` names. (see `index.html` as an example). Link `drawmenutree.js` by including `<script type="text/javascript" src="drawmenutree.js"></script>` in 'index.html'. This will create a global variable `DrawMenuTree`. Call `DrawMenuTree.drawOnLoad()` in another script tag anywhere in the document. The menu will be drawn as a tree as soon as the document loads (an event listener is added to listen for `DOMContentLoaded`).
