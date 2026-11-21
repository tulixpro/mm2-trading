import bpy, math, os

# Extra generic vehicle blockouts with distinct silhouettes. Units are metres.
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Vehicles_Export")
os.makedirs(OUT, exist_ok=True)

def material(name, color, metallic=0.25, roughness=0.3):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Metallic"].default_value = metallic
    p.inputs["Roughness"].default_value = roughness
    return m

PAINTS = [
    material("SUV graphite metallic", (.12,.15,.18), .7),
    material("Hatchback silver", (.48,.52,.56), .7),
    material("Sport coupe red", (.5,.018,.012), .65),
    material("Estate deep green", (.025,.16,.095), .6),
    material("Taxi yellow", (.95,.58,.015), .5),
]
GLASS = material("Dark automotive glazing", (.012,.035,.045), .25, .15)
RUBBER = material("Tire rubber", (.012,.014,.017), 0, .8)
ALLOY = material("Alloy", (.52,.57,.62), .85, .2)
TRIM = material("Black trim", (.018,.022,.026), .15, .4)
LAMP = material("Headlamp", (.8,.9,1), .1, .15)
TAIL = material("Tail lamp", (.55,.012,.018), .1, .2)

def cube(name, loc, dims, mat, bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o=bpy.context.object; o.name=name; o.dimensions=dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    for f in o.data.polygons: f.use_smooth=True
    if bevel:
        b=o.modifiers.new("Rounded manufactured edges","BEVEL"); b.width=bevel; b.segments=3
        o.modifiers.new("Weighted normals","WEIGHTED_NORMAL")
    return o

def wheel(x,y,z):
    bpy.ops.mesh.primitive_torus_add(major_radius=.32, minor_radius=.095, major_segments=40, minor_segments=12, location=(x,y,z), rotation=(math.pi/2,0,0))
    bpy.context.object.name="Rubber tire"; bpy.context.object.data.materials.append(RUBBER)
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=.235, depth=.06, location=(x,y*1.07,z), rotation=(math.pi/2,0,0))
    bpy.context.object.name="Alloy wheel face"; bpy.context.object.data.materials.append(ALLOY)

def make_vehicle(name, paint, length, height, cabin_len, cabin_height, wheelbase, kind):
    bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)
    cube("Main body", (0,0,.62), (length,1.88,.52), paint,.18)
    cube("Bonnet", (length*.31,0,.88), (length*.34,1.82,.18), paint,.10)
    cube("Cabin", (-length*.08,0,1.02+ cabin_height*.30), (cabin_len,1.68,cabin_height), paint,.14)
    cube("Roof", (-length*.08,0,1.02+cabin_height*.80), (cabin_len*.66,1.60,.11), paint,.06)
    # Front/rear glass and side windows
    cube("Front windshield", (cabin_len*.40,0,1.20), (.09,1.52,.50), GLASS,.025)
    cube("Rear windshield", (-cabin_len*.57,0,1.18), (.09,1.52,.46), GLASS,.025)
    for y in (-.855,.855):
        cube("Front side glass", (cabin_len*.18,y,1.28), (cabin_len*.38,.035,.34), GLASS,.025)
        cube("Rear side glass", (-cabin_len*.28,y,1.28), (cabin_len*.34,.035,.34), GLASS,.025)
        cube("Door handle", (-.05,y*1.01,.88), (.20,.03,.035), ALLOY,.01)
        cube("Side mirror", (cabin_len*.42,y*1.10,1.18), (.18,.12,.10), TRIM,.025)
        cube("Headlamp", (length*.50,y*.72,.82), (.06,.28,.12), LAMP,.025)
        cube("Tail lamp", (-length*.50,y*.72,.76), (.06,.25,.14), TAIL,.025)
    cube("Front bumper", (length*.51,0,.43), (.13,1.86,.18), TRIM,.04)
    cube("Rear bumper", (-length*.51,0,.43), (.13,1.86,.18), TRIM,.04)
    for x in (-wheelbase/2,wheelbase/2):
        for y in (-.94,.94): wheel(x,y,.43)
    if kind=="SUV":
        for y in (-.62,.62): cube("Roof rail",(-.05,y,1.85),(1.55,.035,.04),ALLOY,.015)
        cube("SUV skid plate",(length*.51,0,.34),(.12,1.0,.08),ALLOY,.02)
    elif kind=="Sport Coupe":
        cube("Rear spoiler",(-length*.48,0,1.12),(.13,1.28,.08),TRIM,.02)
        cube("Front splitter",(length*.51,0,.32),(.18,1.55,.06),TRIM,.02)
    elif kind=="Estate":
        for y in (-.62,.62): cube("Roof rail",(-.12,y,1.60),(2.0,.035,.04),ALLOY,.015)
    elif kind=="Taxi":
        cube("Taxi roof sign",(-.05,0,1.72),(.42,.24,.12),PAINTS[4],.025)
        for y in (-.955,.955): cube("Taxi door stripe",(-.05,y,.72),(.85,.025,.10),TRIM,.01)
    bpy.ops.object.select_all(action="SELECT")
    bpy.context.view_layer.objects.active=bpy.context.selected_objects[0]
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.fbx(filepath=os.path.join(OUT,name+".fbx"), use_selection=True, object_types={"MESH"}, axis_forward="-Z", axis_up="Y", apply_unit_scale=True)
    print("Exported", name)

make_vehicle("FL_Urban_SUV", PAINTS[0], 4.85, 1.02, 2.75, .78, 2.85, "SUV")
make_vehicle("FL_Compact_Hatchback", PAINTS[1], 4.05, .68, 2.25, .60, 2.55, "Hatchback")
make_vehicle("FL_Sport_Coupe", PAINTS[2], 4.55, .53, 2.25, .52, 2.72, "Sport Coupe")
make_vehicle("FL_Estate_Wagon", PAINTS[3], 4.90, .72, 3.00, .68, 2.90, "Estate")
make_vehicle("FL_City_Taxi", PAINTS[4], 4.65, .72, 2.55, .68, 2.78, "Taxi")
print("Exported five additional vehicle meshes to Vehicles_Export.")
