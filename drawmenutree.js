window.onload = function() {
    let ROOT_WINDOW_POSITION = '50%'
    let CONTAINER_MARGIN_TOP = 60
    let CONTAINER_MARGIN_LEFT = 15
    let ITEM_H_SPACING = 65
    let ITEM_V_SPACING = 8
    let CATEGORY_H_SPACING = 45
    let CATEGORY_V_SPACING = 16
    let CATEGORY_TEXT_X = 8
    let CATEGORY_TEXT_Y = -3
    let TEXT_OFFSET_X = 9
    let TEXT_OFFSET_Y = -29
    let LOGO_X = 241
    let LOGO_Y = -75
    let ABOUT_X = -78
    let ABOUT_Y = -42
    let LEAF_HEIGHT = 15
    let LINE_THICKNESS = 4
    let CSS_UNIT = 'px'
    let ID_HOME_DIV = 'homepage'
    let ID_HOME_SUB_DIV = 'homepadding'
    let ID_CATEGORY_CONTAINER = 'homecontainer'
    let ID_ABOUT_BUTTON = 'homeabout'
    let ID_HOME_LOGO = 'homelogo'
    let CLASS_CATEGORY = 'treecategory'
    let CLASS_ITEM = 'treeitem'
    let CLASS_HLINE = 'treehline'
    let CLASS_VLINE = 'treevline'
    let CLASS_UDLINE = 'treeudline'
    let CLASS_DDLINE = 'treeddline'
    let CLASS_LEAFNODE = 'treenode'
    let CATEGORY_HEADING = 'h4'
    let ITEM_HEADING = 'h5'

    class MenuTreeNode {
        constructor(element) {
            this.element = element
            this.parent = null
            this.children = []
            this.abs_x, this.abs_y = 0, 0
            let bounding_box = element.querySelector(CATEGORY_HEADING + ', ' + ITEM_HEADING).getBoundingClientRect()
            this.width = bounding_box.width
            this.height = bounding_box.height
        }

        rel_x() {
            if (this.is_root()) {
                return 0
            }
            return this.abs_x - this.parent.abs_x
        }

        rel_y() {
            if (this.is_root()) {
                return 0
            }
            return this.abs_y - this.parent.abs_y
        }

        add_child(node) {
            this.children.push(node)
            node.parent = this
        }

        is_root() {
            return this.parent === null
        }

        is_leaf() {
            return this.children.length == 0
        }

        // leaf nodes determine y based on order
        // parent y is determined by average of children y
        assign_y_position(start_y) {
            let current_y = start_y
            if (this.is_leaf()) {
                this.abs_y = current_y
                return current_y + this.height + ITEM_V_SPACING
            } else {
                let child_y_sum = 0
                for (child of this.children) {
                    current_y = child.assign_y_position(current_y)
                    child_y_sum += child.abs_y
                }
                this.abs_y = child_y_sum / this.children.length
                return current_y + CATEGORY_V_SPACING
            }
        }

        // set by breadth first search by tree depth
        assign_x_position(start_x, root_node) {
            // calculate x component of vector from root_node to abs_y at length start_x
            // have min movement horizontally
            let height = Math.abs(this.abs_y - root_node.abs_y)
            this.abs_x = Math.sqrt(Math.max(0, start_x ** 2 - height ** 2))
            if (!this.is_root()) {
                this.abs_x = Math.max(this.abs_x, this.parent.abs_x + CATEGORY_H_SPACING)
            }
            if (this.is_leaf()) {
                return this.abs_x + this.width
            }
            let max_x = 0
            for (child of this.children) {
                max_x = Math.max(max_x, child.assign_x_position(start_x + this.width + ITEM_H_SPACING, root_node))
            }
            return max_x
        }

        // shifts position of node and children by specified amounts
        move(x, y) {
            for (child of iterate_descendants(this)) {
                child.abs_x += x
                child.abs_y += y
            }
        }

        // shifts position of node and children to x, y position
        move_to(x, y) {
            this.move(x - this.abs_x, y - this.abs_y)
        }
    }

    // depth first
    function* iterate_descendants(node) {
        yield node
        for (child of node.children) {
            for (item of iterate_descendants(child)) {
                yield item
            }
        }
    }

    function generate_node_from_element(element) {
        let class_attribute = element.getAttribute('class')
        if (class_attribute !== CLASS_CATEGORY && class_attribute !== CLASS_ITEM) {
            return null
        }
        let node = new MenuTreeNode(element)
        for (child of element.children) {
            let child_node = generate_node_from_element(child)
            if (child_node !== null) {
                node.add_child(child_node)
            }
        }
        return node
    }

    function set_position_top(element, x, y) {
        element.style['left'] = x.toString() + CSS_UNIT
        element.style['top'] = y.toString() + CSS_UNIT
    }

    function set_position_bottom(element, x, y) {
        element.style['left'] = x.toString() + CSS_UNIT
        element.style['bottom'] = y.toString() + CSS_UNIT
    }

    function set_size(element, width, height) {
        element.style['width'] = width.toString() + CSS_UNIT
        element.style['height'] = height.toString() + CSS_UNIT
    }

    function assign_node_line(node) {
        if (node.is_leaf()) {
            let category = document.createElement('DIV')
            category.setAttribute('class', CLASS_CATEGORY)
            node.parent.element.removeChild(node.element)
            category.appendChild(node.element)
            node.parent.element.appendChild(category)
            node.element = category
        } else {
            heading = node.element.querySelector(CATEGORY_HEADING)
            set_position_top(heading, node.rel_x() + CATEGORY_TEXT_X, node.rel_y() - node.height + CATEGORY_TEXT_Y)
        }
        if (node.is_root()) {
            return
        }
        set_position_top(node.element, node.parent.rel_x(), node.parent.rel_y())
        let slope = node.rel_y() / node.rel_x()
            // if (NE, SE, NW, SW) { draw slope, then h-line
        if (Math.abs(slope) <= 1) {
            let intermediate_x = 0
            if (slope > 0) { // orientation like this -> /
                intermediate_x += node.rel_y()
            }
            if (slope < 0) { // orientation like this -> \
                intermediate_x -= node.rel_y()
            }
            if (slope != 0) {
                draw_slope_line(node.element, 0, 0, intermediate_x, node.rel_y())
            }
            draw_h_line(node.element, intermediate_x, node.rel_x(), node.rel_y())
        }
        // if (N/S) { draw v-line, then slope
        else {
            let intermediate_y = node.rel_y()
            if (slope > 1) { // orientation like this -> /
                intermediate_y -= node.rel_x()
            }
            if (slope < -1) { // orientation like this -> \
                intermediate_y += node.rel_x()
            }
            draw_v_line(node.element, 0, 0, intermediate_y)
            draw_slope_line(node.element, 0, intermediate_y, node.rel_x(), node.rel_y())
        }
    }

    function draw_h_line(parent, x1, x2, y) {
        let line = document.createElement('DIV')
        line.setAttribute('class', CLASS_HLINE)
        set_position_top(line, Math.min(x1, x2), y - LINE_THICKNESS / 2)
        set_size(line, Math.abs(x2 - x1), LINE_THICKNESS)
        parent.appendChild(line)
    }

    function draw_v_line(parent, x, y1, y2) {
        let line = document.createElement('DIV')
        line.setAttribute('class', CLASS_VLINE)
        set_position_top(line, x - LINE_THICKNESS / 2, Math.min(y1, y2))
        set_size(line, LINE_THICKNESS, Math.abs(y2 - y1))
        parent.appendChild(line)
    }

    function draw_slope_line(parent, x1, y1, x2, y2) {
        let base_length = Math.abs(x2 - x1)
        let line = document.createElement('DIV')
        parent.appendChild(line)
        set_position_top(line, Math.min(x1, x2) - 1, Math.min(y1, y2) - 1) // offset slightly to smooth joins
        set_size(line, base_length + 2, base_length + 2)
        if ((y2 > y1 && x2 > x1) || (y2 < y1 && x2 < x1)) { // orientation like this - > \
            line.setAttribute('class', CLASS_DDLINE)
        } else {
            line.setAttribute('class', CLASS_UDLINE)
        }
    }

    function draw_leaf(node, target_cost) {
        let item_div = node.element.querySelector('.' + CLASS_ITEM)
        draw_h_line(node.element, node.rel_x(), node.rel_x(), node.rel_y())
        set_position_top(item_div, node.rel_x() + TEXT_OFFSET_X, node.rel_y() + TEXT_OFFSET_Y)
        let treenode = document.createElement('DIV')
        set_position_top(treenode, node.rel_x(), node.rel_y() - LEAF_HEIGHT)
        treenode.setAttribute('class', CLASS_LEAFNODE)
        node.element.appendChild(treenode)
    }

    function build_tree() {
        let home_container = document.getElementById(ID_CATEGORY_CONTAINER)
        home_container.style['position'] = 'absolute'
        let root_node = generate_node_from_element(home_container.querySelector('.' + CLASS_CATEGORY))
        let max_y = root_node.assign_y_position(0)
        let max_x = root_node.assign_x_position(0, root_node)
        set_position_bottom(home_container, 0, -1 / 2 * max_y)
        let bottom_y = max_y - root_node.abs_y
        let bottom_x = LOGO_X + CONTAINER_MARGIN_LEFT
        set_position_bottom(root_node.element, bottom_x, bottom_y)
        for (node of iterate_descendants(root_node)) {
            assign_node_line(node)
        }
        let target_cost = 0
        for (node of iterate_descendants(root_node)) {
            target_cost = Math.max(node.line_cost, target_cost)
        }
        for (node of iterate_descendants(root_node)) {
            if (node.is_leaf()) {
                draw_leaf(node, target_cost)
            }
        }
        home_container.style['min-height'] = (max_y + CONTAINER_MARGIN_TOP).toString() + CSS_UNIT
        document.getElementById(ID_HOME_DIV).style['max-width'] = (bottom_x + max_x).toString() + CSS_UNIT
        document.getElementById(ID_HOME_SUB_DIV).style['min-height'] = (max_y * 1 / 2 + CONTAINER_MARGIN_TOP).toString() + CSS_UNIT
        document.getElementById(ID_HOME_SUB_DIV).style['height'] = ROOT_WINDOW_POSITION
        set_position_bottom(document.getElementById(ID_ABOUT_BUTTON), bottom_x + ABOUT_X, bottom_y + ABOUT_Y)
        set_position_bottom(document.getElementById(ID_HOME_LOGO), bottom_x - LOGO_X, bottom_y + LOGO_Y)
    }

    // if (window.matchMedia("(min-width: 450px)").matches)
    build_tree()
}