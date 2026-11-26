import bpy
import math
import os
from mathutils import Vector

OUT = os.environ.get("FRANKFURT_ASSET_OUT", "dist/frankfurt-life-models")
os.makedirs(OUT, exist_ok=True)

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)

def mat(name, color, metallic=0.0, roughness=0.55):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*color, 1)
    bs.inputs["Metallic"].default_value = metallic
    bs.inputs["Roughness"].default_value = roughness
    return m

PAINT_BLUE = mat("Deep Frankfurt Blue Automotive Paint", (0.025,0.12,0.24), .72, .24)
PAINT_SILVER = mat("Silver Metallic Paint", (.42,.48,.53), .78, .23)
PAINT_WHITE = mat("Police White Paint", (.82,.85,.86), .45, .27)
BLACK = mat("Rubber and Trim", (.018,.023,.028), .05, .72)
GLASS = mat("Smoked Safety Glass", (.018,.075,.105), .35, .16)
CHROME = mat("Brushed Aluminium", (.58,.63,.66), .82, .22)
LIGHT = mat("Warm LED Headlamps", (.96,.83,.57), .1, .2)
RED = mat("Rear Lamps", (.58,.018,.012), .1, .25)
BLUE = mat("Emergency Blue", (.015,.08,.8), .25, .18)
RED_LAMP = mat("Emergency Red", (.85,.012,.008), .2, .18)
CONCRETE = mat("Warm Concrete", (.43,.42,.38), 0, .9)
BRICK = mat("Frankfurt Brick", (.39,.18,.12), 0, .88)
PLASTER = mat("Light Facade Plaster", (.72,.68,.57), 0, .9)
DARK = mat("Dark Window Frames", (.045,.06,.065), .35, .35)
ROOF = mat("Roof Slate", (.12,.15,.17), .1, .75)
ASPHALT = mat("Road Asphalt", (.055,.065,.072), 0, .95)
GREEN = mat("Plane Tree Leaves", (.12,.28,.12), 0, .9)
BARK = mat("Tree Bark", (.22,.12,.07), 0, .95)
SIGN = mat("Shop Sign", (.025,.16,.22), .25, .4)
YELLOW = mat("Street Marking", (.92,.72,.12), .05, .6)

def bevel(obj, width=.06, segments=3):
    if obj.type == "MESH" and width > 0:
        mod = obj.modifiers.new("Soft manufactured edges", "BEVEL")
        mod.width = width
        mod.segments = segments
        mod.limit_method = "ANGLE"
        obj.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
    return obj

def cube(name, loc, scale, material, edge=.03):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material: o.data.materials.append(material)
    return bevel(o, edge)

def cyl(name, loc, radius, depth, material, vertices=24, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation or (0,0,0))
    o=bpy.context.object; o.name=name
    if material: o.data.materials.append(material)
    bevel(o, .018, 2)
    return o

def uv(name, loc, scale, material, segments=24, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material: o.data.materials.append(material)
    return o

def export_asset(filename, objects):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects: o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, filename), export_format="GLB", use_selection=True, export_apply=True)
    print("EXPORTED", filename, len(objects), "objects")

def vehicle(name, bodymat, police=False, estate=False):
    clear_scene()
    parts=[]
    def add(o): parts.append(o); return o
    # Longitudinal X axis; front is +X. Sculpted lower body, hood and rear deck.
    add(cube(name+" | underbody", (0,0,.72), (4.45,1.82,.48), BLACK,.18))
    add(cube(name+" | main body", (0,0,1.03), (4.55,1.91,.66), bodymat,.22))
    add(cube(name+" | hood", (1.42,0,1.38), (1.35,1.82,.22), bodymat,.12))
    add(cube(name+" | rear deck", (-1.68,0,1.37), (1.05,1.82,.22), bodymat,.12))
    # cabin roof, windshield, rear glass and four side window panels
    add(cube(name+" | roof", (-.28,0,2.13), (2.05,1.56,.16), bodymat,.1))
    add(cube(name+" | windscreen", (.77,0,1.83), (.075,1.55,.61), GLASS,.025))
    add(cube(name+" | rear glass", (-1.32,0,1.83), (.075,1.53,.56), GLASS,.025))
    for side in (-1,1):
        for x in (-.88,.18):
            add(cube(name+" | side glazing", (x,side*.94,1.86), (.88,.035,.48), GLASS,.045))
        add(cube(name+" | beltline trim", (-.28,side*.975,1.49), (2.05,.035,.045), CHROME,.012))
        add(cube(name+" | door handle", (-.12,side*.995,1.32), (.2,.035,.055), CHROME,.018))
        add(cube(name+" | side mirror", (.73,side*1.03,1.72), (.24,.16,.12), bodymat,.045))
        add(cube(name+" | mirror glass", (.77,side*1.12,1.73), (.12,.025,.075), CHROME,.015))
        add(cube(name+" | side skirt", (0,side*.94,.76), (2.55,.09,.16), BLACK,.035))
    # front fascia, grille, lamps and rear lamp clusters
    add(cube(name+" | front bumper", (2.26,0,.82), (.18,1.82,.24), BLACK,.06))
    add(cube(name+" | front grille", (2.365,0,1.12), (.045,.76,.24), BLACK,.025))
    for z in (.99,1.08,1.17,1.26):
        add(cube(name+" | grille slat", (2.397,0,z), (.025,.62,.018), CHROME,.006))
    for side in (-1,1):
        add(cube(name+" | headlamp", (2.30,side*.66,1.32), (.12,.42,.2), LIGHT,.055))
        add(cube(name+" | rear lamp", (-2.29,side*.69,1.25), (.12,.34,.25), RED,.04))
        add(cube(name+" | fog lamp", (2.37,side*.72,.87), (.05,.18,.08), LIGHT,.02))
    add(cube(name+" | rear bumper", (-2.28,0,.83), (.16,1.82,.22), CHROME,.05))
    # wheels, tyres, rims, hubs; wheel cylinders lie across Y
    for x in (-1.48,1.48):
        for side in (-1,1):
            add(cyl(name+" | tyre", (x,side*.94,.66), .48,.25, BLACK,32,(math.pi/2,0,0)))
            add(cyl(name+" | alloy rim", (x,side*1.085,.66), .29,.045, CHROME,32,(math.pi/2,0,0)))
            add(cyl(name+" | hub cap", (x,side*1.112,.66), .11,.05, BLACK,24,(math.pi/2,0,0)))
            for a in range(5):
                ang=a*math.tau/5
                add(cyl(name+" | rim spoke", (x+.19*math.cos(ang),side*1.115,.66+.19*math.sin(ang)), .026,.052, CHROME,8,(math.pi/2,0,0)))
    # windshield wipers and number plates
    for side in (-1,1):
        add(cube(name+" | wiper", (.91,side*.28,1.55), (.48,.025,.025), BLACK,.008))
    add(cube(name+" | front registration", (2.39,0,.94), (.025,.48,.13), CHROME,.012))
    add(cube(name+" | rear registration", (-2.38,0,.94), (.025,.48,.13), CHROME,.012))
    if estate:
        add(cube(name+" | estate roof extension", (-1.0,0,2.12), (1.38,1.53,.12), bodymat,.07))
        for side in (-1,1):
            add(cube(name+" | roof rail", (-.35,side*.58,2.23), (2.5,.045,.045), CHROME,.02))
    if police:
        add(cube(name+" | dark police belt", (0,0,1.28), (3.45,1.94,.18), BLACK,.025))
        add(cube(name+" | roof lightbar base", (-.12,0,2.25), (.62,.28,.09), BLACK,.025))
        add(cube(name+" | blue beacon", (-.12,-.16,2.36), (.25,.22,.14), BLUE,.04))
        add(cube(name+" | red beacon", (-.12,.16,2.36), (.25,.22,.14), RED_LAMP,.04))
        for side in (-1,1):
            add(cube(name+" | door shield", (.0,side*.995,1.30), (.45,.025,.28), CHROME,.025))
    export_asset(name.lower().replace(" ","-")+".glb",parts)

def building():
    clear_scene(); p=[]
    def a(o): p.append(o); return o
    # Mixed-use Frankfurt corner block, shop floor and three upper storeys.
    a(cube("Corner block | ground floor", (0,0,1.8),(14,10,3.6),PLASTER,.12))
    a(cube("Corner block | upper facade", (0,0,9.3),(14,10,11.4),BRICK,.08))
    a(cube("Corner block | cornice", (0,0,15.1),(14.35,10.35,.32),CONCRETE,.06))
    a(cube("Corner block | roof", (0,0,15.35),(14.1,10.1,.22),ROOF,.05))
    # street-facing repeated windows with stone lintels and sills
    for floor,z in enumerate((5.2,8.0,10.8,13.55)):
        for x in (-5.1,-1.7,1.7,5.1):
            a(cube("Facade window frame",(x,-5.04,z),(1.55,.12,1.85),DARK,.035))
            a(cube("Window glazing",(x,-5.12,z),(1.34,.04,1.62),GLASS,.018))
            a(cube("Window mullion",(x,-5.16,z),(.045,.035,1.58),CHROME,.008))
            a(cube("Window sill",(x,-5.18,z-.98),(1.8,.28,.12),CONCRETE,.025))
            a(cube("Window lintel",(x,-5.17,z+.98),(1.8,.22,.12),CONCRETE,.025))
    # shopfront with glazed bays and sign
    for x in (-4.2,-1.4,1.4,4.2):
        a(cube("Shopfront frame",(x,-5.12,1.65),(2.35,.12,2.65),DARK,.025))
        a(cube("Shopfront glass",(x,-5.2,1.65),(2.12,.04,2.4),GLASS,.015))
    a(cube("Shop fascia",(0,-5.22,3.15),(13.1,.28,.48),SIGN,.04))
    a(cube("Shop sign panel",(0,-5.39,3.18),(6.0,.045,.27),PLASTER,.02))
    # side elevation windows, roof parapet, chimney and downpipes
    for x in (-6.95,6.95):
        a(cube("Corner quoins",(x,-5.12,8.7),(.22,.2,12.0),CONCRETE,.025))
    for y in (-3.4,0,3.4):
        a(cube("Side window",(7.08,y,8.4),(.05,1.45,1.9),GLASS,.025))
    a(cube("Roof parapet",(0,0,15.75),(14.3,10.3,.55),BRICK,.07))
    a(cube("Rooftop chimney",(-4,2,16.35),(1.0,1.0,1.1),CONCRETE,.05))
    export_asset("frankfurt-mixed-use-building.glb",p)

def street_props():
    clear_scene(); p=[]
    def a(o): p.append(o); return o
    # classic Frankfurt-style street lantern with curved arm and lamp housing
    a(cyl("Lantern pole",(0,0,3.0),.075,6.0,BLACK,16))
    a(cyl("Lantern base",(0,0,.18),.16,.36,CHROME,20))
    a(cube("Lantern arm",(.42,0,5.92),(.95,.09,.09),BLACK,.035))
    a(cube("Lantern head",(.85,0,5.78),(.48,.38,.18),BLACK,.07))
    a(cube("Lantern diffuser",(.85,0,5.67),(.35,.28,.035),LIGHT,.025))
    export_asset("frankfurt-street-lamp.glb",p)

def tree():
    clear_scene(); p=[]
    trunk=cyl("Plane tree trunk",(0,0,1.65),.23,3.3,BARK,16); p.append(trunk)
    for loc,scale in [((0,0,4.0),(1.45,1.25,1.25)),((-.85,.15,3.55),(.95,.9,.9)),((.82,-.1,3.6),(.98,.9,.95)),((.05,.65,4.55),(.9,.85,.8))]:
        p.append(uv("Plane tree canopy",loc,scale,GREEN,20,12))
    export_asset("frankfurt-plane-tree.glb",p)

vehicle("Frankfurt Compact",PAINT_BLUE)
vehicle("Frankfurt Estate",PAINT_SILVER,estate=True)
vehicle("Frankfurt Police Sedan",PAINT_WHITE,police=True)
building()
street_props()
tree()
print("Asset pack complete:", OUT)
