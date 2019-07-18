import math
import lxml.html
from PIL import Image, ImageDraw, ImageColor
# pull hierarchy structure from HTML

"""
arts
    music
        composition
            koans
            ceremony of union
            choral
                the seven teachings
                soldier's peace
                bid adieu
        music teaching
    visual
        clarinetophone
    writing
        ?
        ?
        vignette
code
    littlenet
    draw tree
    sterilizer printer
"""

# layout drawn tree
# leaf nodes: heading, blurb, link
# intermediate nodes: category
# do a depth first search from top to bottom, assign a text line per leaf node, assign horizontal width per branch, put category header to left of branches

ITEM_HEIGHT = 40          # px
CHAR_WIDTH = 5            # px
ITEM_H_SPACING = 30       # px
CATEGORY_V_SPACING = 20   # px
MIN_LEAF_WIDTH = 20
LEAF_HEIGHT = 10
LEAF_CIRCLE_RADIUS = 4
TEXT_OFFSET_X = 10
TEXT_OFFSET_Y = 2
ORIGIN_X, ORIGIN_Y = 200, 600

class MenuTreeNode():
    def __init__(self, data, width=0, parent_node=None):
        self.data = data
        self.parent = parent_node
        self.children = []
        self.x, self.y = 0, 0
        self.line_cost = 0
        self.width = width
        self.height = ITEM_HEIGHT
    
    def add_child(self, node):
        self.children.append(node)
        node.parent = self
    
    def is_root(self):
        return self.parent is None

    def is_leaf(self):
        return not self.children

    # depth first
    def iterate_descendants(self):
        yield self
        for child in self.children:
            for item in child.iterate_descendants():
                yield item

    # parent y is determined by average of children y
    # leaf nodes determine y based on order
    def assign_y_position(self, current_y):
        if self.is_leaf():
            self.y = current_y
            return current_y + self.height
        else:
            child_y_sum = 0
            for child in self.children:
                current_y = child.assign_y_position(current_y)
                child_y_sum += child.y
            self.y = child_y_sum / len(self.children)
            return current_y + CATEGORY_V_SPACING

    # set by breadth first search by tree depth
    # width of item used to calculate next x position
    def assign_x_position(self, current_x):
        self.x = current_x + ITEM_H_SPACING
        if self.is_leaf():
            return
        for child in self.children:
            child.assign_x_position(self.x + self.width)
    
    # shifts position of node and children by specified amounts
    def move(self, x, y):
        for child in self.iterate_descendants():
            child.x += x
            child.y += y
    
    # shifts position of node and children to x, y position
    def move_to(self, x, y):
        self.move(x - self.x, y - self.y)

# output appropriate html and style
# 8 cardinal directions
# fill order: E, NE, SE, N, S, NW, SW, W
# assign by closest direction, shifting over if necessary
def assign_node_line(node):
    if node.is_root():
        return
    cost = node.parent.line_cost
    slope = (node.y - node.parent.y) / (node.x - node.parent.x)
    # if NE, SE, NW, SW: draw slope, then h-line
    if abs(slope) <= 1:
        intermediate_x = node.parent.x
        if slope > 0:  # orientation like this -> /
            intermediate_x += node.y - node.parent.y
        if slope < 0:  # orientation like this -> \
            intermediate_x -= node.y - node.parent.y
        if slope != 0:
            cost += draw_slope_line(node.parent.x, node.parent.y, intermediate_x, node.y)
        cost += draw_h_line(intermediate_x, node.x, node.y)
    # if N/S: draw v-line, then slope
    else:
        intermediate_y = node.y
        if slope > 1:  # orientation like this -> /
            intermediate_y -= node.x - node.parent.x
        if slope < -1:   # orientation like this -> \
            intermediate_y += node.x - node.parent.x
        cost += draw_v_line(node.parent.x, node.parent.y, intermediate_y)
        cost += draw_slope_line(node.parent.x, intermediate_y, node.x, node.y)
    node.line_cost = cost

IMAGE = Image.new('RGBA', (1920, 1080), (255, 255, 255, 255))
DRAW = ImageDraw.Draw(IMAGE)

def draw_h_line(x1, x2, y):
    DRAW.line((x1, y, x2, y), (0, 0, 0)) #TODO
    return 0.8 * (x2 - x1) # cost weighting of line

def draw_v_line(x, y1, y2):
    DRAW.line((x, y1, x, y2), (0,0,0))
    return 1.2 * (y2 - y1) # cost weighting of line

def draw_slope_line(x1, y1, x2, y2):
    DRAW.line((x1, y1, x2, y2), (0, 0, 0))
    if (y2 > y1 and x2 > x1) or (y2 < y1 and x2 < x1):  # orientation like this -> \
        return 2 * (x2 - x1)  # cost weighting of downward slope
    return 4 * (x2 - x1)  # cost weighting of upward slope

def draw_leaf(node, target_cost):
    extra_x = max(target_cost - node.line_cost, MIN_LEAF_WIDTH)
    x_angle_point = node.x + extra_x
    DRAW.line((node.x, node.y, x_angle_point, node.y), (0, 0, 0))
    x_circle_point = x_angle_point + LEAF_HEIGHT
    y_circle_point = node.y - LEAF_HEIGHT
    DRAW.line((x_angle_point, node.y, x_circle_point, y_circle_point), (0,0,0))
    DRAW.ellipse((x_circle_point, y_circle_point - LEAF_CIRCLE_RADIUS, x_circle_point + LEAF_CIRCLE_RADIUS, y_circle_point), outline=(0, 0, 0))
    DRAW.text((x_circle_point + TEXT_OFFSET_X, y_circle_point - TEXT_OFFSET_Y), get_element_heading(node.data[0]), (0,0,0))

def generate_tree_from_html(filename):
    html_string = ''
    with open(filename, 'r') as file:
        html_string = file.read()
    document = lxml.html.fromstring(html_string)
    
    # find id='homecontainer'
    root = document.get_element_by_id('homecontainer')
    root = root.xpath('div[@class="category"]')[0]
    return generate_node_from_element(root)

    # print(document.find_class('item'))
    #     print('container', container.xpath('h3')[0].text_content())
    # for container in root.xpath('div[@class="category"]'): # branch node
    #     print('container', container.xpath('h3')[0].text_content())

    # for item in root.xpath('div[@class="item"]'): # leaf node
    #     print('item', item.xpath('a/h4')[0].text_content())
    # for each class='category'
    # create leaf node if class='item'
    # extract html inside of div as data
    # create branch node if class='category'
    # extract html that isn't item or category as data

def get_element_heading(element):
    return element.xpath('//h3|//h4')[0].text_content()

def generate_node_from_element(element):
    class_attribute = element.get('class')
    if class_attribute is None or class_attribute != 'category' and class_attribute != 'item':
        return None
    node = MenuTreeNode([], width=len(get_element_heading(element)) * CHAR_WIDTH)
    for child in element:
        child_node = generate_node_from_element(child)
        if child_node is None:
            node.data.append(child)
        else:
            node.add_child(child_node)
    return node

def test_draw(root_node, im, draw):
    for node in root_node.iterate_descendants():
        if not node.is_root():
            draw.line((node.parent.x, node.parent.y, node.x, node.y), (0, 255, 255))
        draw.text((node.x, node.y), get_element_heading(node.data[0]), (0, 0, 0))
    im.show()

def test_create_nodes():
    root = MenuTreeNode({'heading': 'testA'})
    sub_b = MenuTreeNode({'heading': 'testB'})
    sub_c = MenuTreeNode({'heading': 'testC'})
    root.add_child(sub_b)
    root.add_child(sub_c)
    sub_b.add_child(MenuTreeNode({'heading': 'testD'}))
    sub_b.add_child(MenuTreeNode({'heading': 'testE'}))
    sub_b.add_child(MenuTreeNode({'heading': 'testF'}))
    sub_g = MenuTreeNode({'heading': 'testG'})
    sub_c.add_child(sub_g)
    sub_g.add_child(MenuTreeNode({'heading': 'testH'}))
    sub_c.add_child(MenuTreeNode({'heading': 'testI'}))
    return root

def build_tree(root_node):
    root_node.assign_y_position(0)
    root_node.assign_x_position(0)
    root_node.move_to(ORIGIN_X, ORIGIN_Y)
    for node in root_node.iterate_descendants():
        assign_node_line(node)
    target_cost = max(node.line_cost for node in root_node.iterate_descendants())
    for node in root_node.iterate_descendants():
        if node.is_leaf():
            draw_leaf(node, target_cost)

def test():
    root = generate_tree_from_html('index-test.html')

    # root = test_create_nodes()
    build_tree(root)
    # test_draw(root, IMAGE, DRAW)
    IMAGE.show()

test()
