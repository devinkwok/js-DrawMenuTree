/*
each container is told a direction from origin to grow towards (four diagonal corners)
containers report their bounding box back to parent
containers arrange children
 1 child: defaults to a derived direction from its parent
  up-right: /- down-right: \_ up-left: | down left: /
                                       \            |
 multiple children:
 --/--/--/    --
/*

/* simple style for mobile: walk depth first */
parent = document.getElementById("linkmap")

function buildTree(parent) {
    var children = parent.children("container")
    for (var i = 0; i < children.length; ++i) {
        var child = children[i]
            // container
        if (child.tagName == "div") {
            buildTree(child)
        }
        // container
    }
}